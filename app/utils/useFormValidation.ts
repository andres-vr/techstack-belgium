/**
 * Removes dots and spaces from CBE number
 */
export function cleanCbe(raw: string) {
  return String(raw || "").replace(/[.\s]/g, "");
}

/**
 * Checks if CBE has at least 10 digits
 */
export function cbeHasMinimumDigits(cbe: string) {
  return String(cbe || "").replace(/\D/g, "").length >= 10;
}

/**
 * Ensures URL has a protocol (defaults to https://)
 */
export function ensureProtocol(s: string) {
  if (!s) return s;
  s = s.trim();
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(s)) return s;
  return `https://${s}`;
}

/**
 * Normalizes a website URL to its origin
 */
export function normalizeWebsite(website: string) {
  try {
    const url = ensureProtocol(String(website || ""));
    return new URL(url).origin;
  } catch (e) {
    throw new Error("invalid-website");
  }
}

/**
 * Checks if at least one proof URL is present
 */
export function hasProof(proofUrls?: string[]) {
  return (
    Array.isArray(proofUrls) && proofUrls.some((p) => (p || "").trim() !== "")
  );
}

/**
 * Validates tech stack selection
 */
export function validateTechStack(selected: string[], allTechNames: string[]) {
  if (!Array.isArray(selected) || selected.length === 0) {
    return { ok: false, error: "no-tech" };
  }
  const invalid = selected.filter((t) => !allTechNames.includes(t));
  if (invalid.length > 0) return { ok: false, error: "invalid-tech", invalid };
  return { ok: true };
}

/**
 * Validates verification method requirements
 */
export function validateVerification(opts: {
  verificationMethod?: "proof" | "email";
  proofUrls?: string[];
  emailVerified?: boolean;
  emailDomainMatchesWebsite?: boolean;
}) {
  const { verificationMethod, proofUrls, emailVerified, emailDomainMatchesWebsite } = opts;

  const proofPresent = hasProof(proofUrls);
  // If using proof method, require at least one proof
  if (verificationMethod === "proof") {
    if (!proofPresent) return { ok: false, error: "proof-required" };
    return { ok: true };
  }

  // If using email method, require domain match and verified
  if (verificationMethod === "email") {
    if (!emailDomainMatchesWebsite) return { ok: false, error: "email-domain-mismatch" };
    if (!emailVerified) return { ok: false, error: "email-not-verified" };
    return { ok: true };
  }

  // If no explicit method, accept either proof or verified email
  if (!proofPresent && !emailVerified) return { ok: false, error: "proof-or-email" };
  return { ok: true };
}

export function useFormValidation(form: {
  cbe?: string;
  companyName?: string;
  website?: string;
  techStack?: string[];
  locations?: Array<{ province?: string; municipality?: string; address?: string }>;
  proofUrls?: string[];
  verificationMethod?: "proof" | "email";
  contactEmail?: string;
}, options: {
  emailVerified: Ref<boolean>;
  emailDomainMatchesWebsite: Ref<boolean>;
  /** 'add' requires cbe+website, 'complete'/'update' requires companyName */
  formType: 'add' | 'complete' | 'update';
}) {
  const { emailVerified, emailDomainMatchesWebsite, formType } = options;

  /**
   * Computed property that determines if the form can be submitted.
   * Validates all required fields based on form type.
   */
  const canSubmit = computed(() => {
    // Add form: require CBE with minimum digits + website
    if (formType === 'add') {
      if (!form.cbe || !cbeHasMinimumDigits(cleanCbe(form.cbe))) return false;
      if (!form.website || form.website.trim() === "") return false;
    }

    // Complete/Update form: require company name
    if (formType === 'complete' || formType === 'update') {
      if (!form.companyName || form.companyName.trim() === "") return false;
    }

    // All forms: require at least one tech
    if (!Array.isArray(form.techStack) || form.techStack.length === 0) {
      return false;
    }

    // Complete/Update forms: check locations
    if (formType === 'complete' || formType === 'update') {
      if (!Array.isArray(form.locations) || form.locations.length === 0) {
        return false;
      }
    }

    // All forms: validate verification method
    const verificationResult = validateVerification({
      verificationMethod: form.verificationMethod,
      proofUrls: form.proofUrls,
      emailVerified: emailVerified.value,
      emailDomainMatchesWebsite: emailDomainMatchesWebsite.value,
    });

    return verificationResult.ok;
  });

  /**
   * Get validation errors for the form.
   * Returns an array of error keys that can be translated.
   */
  const validationErrors = computed(() => {
    const errors: string[] = [];

    // Add form validations
    if (formType === 'add') {
      if (!form.cbe || !cbeHasMinimumDigits(cleanCbe(form.cbe))) {
        errors.push("validation.cbeRequired");
      }
      if (!form.website || form.website.trim() === "") {
        errors.push("validation.websiteRequired");
      }
    }

    // Complete/Update validations
    if (formType === 'complete' || formType === 'update') {
      if (!form.companyName || form.companyName.trim() === "") {
        errors.push("validation.companyNameRequired");
      }
      if (!Array.isArray(form.locations) || form.locations.length === 0) {
        errors.push("validation.locationRequired");
      }
    }

    // Common validations
    if (!Array.isArray(form.techStack) || form.techStack.length === 0) {
      errors.push("validation.techRequired");
    }

    // Verification validation
    const verificationResult = validateVerification({
      verificationMethod: form.verificationMethod,
      proofUrls: form.proofUrls,
      emailVerified: emailVerified.value,
      emailDomainMatchesWebsite: emailDomainMatchesWebsite.value,
    });

    if (!verificationResult.ok && verificationResult.error) {
      errors.push(`validation.${verificationResult.error}`);
    }

    return errors;
  });

  return {
    canSubmit,
    validationErrors,
  };
}
