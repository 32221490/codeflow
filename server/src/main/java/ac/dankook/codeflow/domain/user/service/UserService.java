package ac.dankook.codeflow.domain.user.service;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import ac.dankook.codeflow.domain.user.dto.UserResponse;
import ac.dankook.codeflow.domain.user.entity.User;
import ac.dankook.codeflow.domain.user.repository.UserRepository;
import ac.dankook.codeflow.global.exception.BusinessException;
import ac.dankook.codeflow.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;

    public UserResponse getMe(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOUNT_NOT_FOUND));
        return UserResponse.from(user);
    }
}
