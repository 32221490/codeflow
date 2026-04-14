package ac.dankook.codeflow.global.security;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtFilter jwtFilter;
        private final OAuth2SuccessHandler oAuth2SuccessHandler;
        private final CustomOAuth2UserService customOAuth2UserService;

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration config = new CorsConfiguration();
                config.setAllowedOriginPatterns(List.of("*"));
                config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                config.setAllowedHeaders(List.of("*"));
                config.setAllowCredentials(true);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", config);
                return source;
        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                // CSRF 비활성화 (JWT 사용)
                                .csrf(AbstractHttpConfigurer::disable)

                                // CORS 설정 적용
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                                // OAuth2 플로우에서 state 임시 저장에 세션 필요 → IF_REQUIRED
                                // JWT로 인증하므로 실제 사용자 세션은 생성되지 않음
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))

                                // 요청 권한 설정
                                .authorizeHttpRequests(auth -> auth
                                                // 인증 없이 허용
                                                .requestMatchers(
                                                                "/api/auth/**",
                                                                "/h2-console/**",
                                                                "/actuator/**")
                                                .permitAll()
                                                // 나머지는 일단 전체 허용 (나중에 인증 추가)
                                                .anyRequest().permitAll())

                                // H2 콘솔 iframe 허용
                                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))

                                // GitHub OAuth2 로그인 설정
                                // /oauth2/authorization/github 로 요청하면 GitHub 인증 페이지로 자동 리다이렉트됨
                                // 인증 완료 후 OAuth2SuccessHandler.onAuthenticationSuccess() 호출
                                .oauth2Login(oauth2 -> oauth2
                                                .userInfoEndpoint(userInfo -> userInfo
                                                                .userService(customOAuth2UserService))
                                                .successHandler(oAuth2SuccessHandler))

                                // JWT 필터 등록
                                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }
}
