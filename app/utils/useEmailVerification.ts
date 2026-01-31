export const useEmailVerification = (form: { contactEmail: string; website: string }) => {
  const { t } = useI18n()
  
  const otpCode = ref("")
  const otpSent = ref(false)
  const emailVerified = ref(false)
  const sendingEmail = ref(false)
  const verifyingOtp = ref(false)
  const error = ref("")
  const otpError = ref("")

  // Computed property to check if email domain matches website domain
  const emailDomainMatchesWebsite = computed(() => {
    if (!form.contactEmail || !form.website) return false;

    try {
      // Extract email domain
      const emailParts = form.contactEmail.split("@");
      const emailDomain = emailParts[1]?.toLowerCase();
      if (!emailDomain) return false;

      // Extract website domain (normalize URL first)
      let websiteUrl = form.website.trim();
      if (
        !websiteUrl.startsWith("http://") &&
        !websiteUrl.startsWith("https://")
      ) {
        websiteUrl = "https://" + websiteUrl;
      }
      const url = new URL(websiteUrl);
      const websiteDomain = url.hostname.replace(/^www\./, "").toLowerCase();

      return emailDomain === websiteDomain;
    } catch (e) {
      return false;
    }
  });

  async function sendVerificationEmail() {
    if (!form.contactEmail) return;

    sendingEmail.value = true;
    error.value = "";
    otpError.value = "";

    try {
      const response = await $fetch<{ success: boolean }>("/api/verify-email", {
        method: "POST",
        body: {
          email: form.contactEmail,
        },
      });

      if (response.success) {
        otpSent.value = true;
      }
    } catch (err: any) {
      error.value = err.data?.statusMessage || t("form.emailVerificationFailed");
    } finally {
      sendingEmail.value = false;
    }
  }

  async function verifyOtp(code?: string) {
    // Use provided code or fall back to internal state
    const codeToVerify = code || otpCode.value.trim();
    if (codeToVerify.length !== 6) return;
    
    verifyingOtp.value = true;
    otpError.value = "";

    try {
      const response = await $fetch<{ verified: boolean }>("/api/verify-otp", {
        method: "POST",
        body: {
          email: form.contactEmail,
          code: codeToVerify,
        },
      });

      if (response.verified) {
        emailVerified.value = true;
      }
    } catch (err: any) {
      otpError.value = err.data?.statusMessage || t("form.otpInvalid");
    } finally {
      verifyingOtp.value = false;
    }
  }

  function resetVerification() {
    otpCode.value = "";
    otpSent.value = false;
    emailVerified.value = false;
    error.value = "";
    otpError.value = "";
  }

  return {
    otpCode,
    otpSent,
    emailVerified,
    sendingEmail,
    verifyingOtp,
    error,
    otpError,
    emailDomainMatchesWebsite,
    sendVerificationEmail,
    verifyOtp,
    resetVerification
  }
}
