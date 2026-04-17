import { normalizeSiteLanguage } from "./language";

const authCopy = {
  en: {
    login: "Log in",
    signup: "Sign up",
    logout: "Log out",
    admin: "Admin",
    signedIn: "Signed in",
    accountFallback: "Account",
    modalTitleSignIn: "Log in to continue",
    modalTitleSignUp: "Create your account",
    modalSubtitleDefault:
      "Use one shared login flow for traveler access and admin access.",
    modalSubtitleSubmit:
      "Log in now to save this survey under your account and submit it safely.",
    emailLabel: "Email",
    passwordLabel: "Password",
    submitSignIn: "Log in",
    submitSignUp: "Create account",
    switchToSignIn: "Already have an account? Log in",
    switchToSignUp: "New here? Create an account",
    resendVerification: "Resend verification email",
    verificationPendingTitle: "Check your email",
    verificationPendingText:
      "Finish email verification first, then come back and log in to continue.",
    verificationSent: "Verification email sent. Please check your inbox.",
    verificationResent: "Verification email sent again.",
    verificationRequired: "Email verification is required before you can continue.",
    close: "Close",
    loading: "Loading...",
    authErrorDefault: "Authentication failed. Please try again.",
    signupSuccess: "Verification email sent. Please confirm your email first.",
    surveyGateTitle: "Login required to submit",
    surveyGateText:
      "You can explore the survey freely, but submitting it requires a logged-in account so we can store your request.",
  },
  ko: {
    login: "로그인",
    signup: "회원가입",
    logout: "로그아웃",
    admin: "관리자",
    signedIn: "로그인됨",
    accountFallback: "내 계정",
    modalTitleSignIn: "로그인하고 계속하기",
    modalTitleSignUp: "계정 만들기",
    modalSubtitleDefault:
      "일반 사용자와 관리자 모두 같은 로그인 화면을 사용합니다.",
    modalSubtitleSubmit:
      "지금 로그인하면 작성한 설문이 내 계정에 저장되고 안전하게 제출됩니다.",
    emailLabel: "이메일",
    passwordLabel: "비밀번호",
    submitSignIn: "로그인",
    submitSignUp: "회원가입",
    switchToSignIn: "이미 계정이 있나요? 로그인",
    switchToSignUp: "처음이신가요? 회원가입",
    resendVerification: "인증 메일 다시 보내기",
    verificationPendingTitle: "이메일을 확인해 주세요",
    verificationPendingText:
      "이메일 인증을 먼저 완료한 뒤 다시 로그인하면 계속 진행할 수 있습니다.",
    verificationSent: "인증 메일을 보냈습니다. 이메일을 확인해 주세요.",
    verificationResent: "인증 메일을 다시 보냈습니다.",
    verificationRequired: "계속하려면 이메일 인증이 먼저 필요합니다.",
    close: "닫기",
    loading: "불러오는 중...",
    authErrorDefault: "인증에 실패했습니다. 다시 시도해 주세요.",
    signupSuccess: "인증 메일을 보냈습니다. 이메일 인증을 먼저 완료해 주세요.",
    surveyGateTitle: "설문 제출 전 로그인이 필요합니다",
    surveyGateText:
      "설문은 로그인 없이 작성할 수 있지만, 제출하려면 누가 보낸 요청인지 저장해야 하므로 로그인이 필요합니다.",
  },
  zh: {
    login: "登录",
    signup: "注册",
    logout: "退出登录",
    admin: "管理",
    signedIn: "已登录",
    accountFallback: "我的账号",
    modalTitleSignIn: "登录后继续",
    modalTitleSignUp: "创建账号",
    modalSubtitleDefault:
      "普通用户和管理员都使用同一个登录界面。",
    modalSubtitleSubmit:
      "现在登录后，这份问卷会保存到你的账号下并安全提交。",
    emailLabel: "邮箱",
    passwordLabel: "密码",
    submitSignIn: "登录",
    submitSignUp: "注册",
    switchToSignIn: "已有账号？去登录",
    switchToSignUp: "第一次使用？去注册",
    resendVerification: "重新发送验证邮件",
    verificationPendingTitle: "请先查看邮箱",
    verificationPendingText:
      "请先完成邮箱验证，然后返回登录继续。",
    verificationSent: "验证邮件已发送，请检查邮箱。",
    verificationResent: "验证邮件已重新发送。",
    verificationRequired: "继续之前需要先完成邮箱验证。",
    close: "关闭",
    loading: "加载中...",
    authErrorDefault: "认证失败，请重试。",
    signupSuccess: "验证邮件已发送，请先完成邮箱验证。",
    surveyGateTitle: "提交问卷前需要登录",
    surveyGateText:
      "你可以先自由填写问卷，但提交前需要登录，这样我们才能把这份请求保存到你的账号名下。",
  },
};

export function getAuthCopy(language) {
  return authCopy[normalizeSiteLanguage(language)] ?? authCopy.zh;
}
