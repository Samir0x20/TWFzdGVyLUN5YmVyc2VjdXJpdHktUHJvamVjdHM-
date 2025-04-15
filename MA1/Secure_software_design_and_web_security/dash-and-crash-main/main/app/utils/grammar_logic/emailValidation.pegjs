Email
  = email:LocalPart "@" domain:Domain {
      if (email.length > 64) {
        throw new Error("Local part of the email must not exceed 64 characters.");
      }
      if (domain.length > 253) {
        throw new Error("Domain part of the email must not exceed 253 characters.");
      }
      return email + "@" + domain;
    }

LocalPart
  = local:LocalChar+ ("." LocalChar+)* {
      if (local.join("").length > 64) {
        throw new Error("Local part of the email must not exceed 64 characters.");
      }
      return text();
    }

LocalChar
  = [a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]

Domain
  = first:Subdomain "." rest:Subdomain+ {
      if (first.length < 2 || first.length > 63) {
        throw new Error("Each subdomain must be between 2 and 63 characters.");
      }
      if (rest.some(sub => sub.length < 2 || sub.length > 63)) {
        throw new Error("Each subdomain must be between 2 and 63 characters.");
      }
      return first + "." + rest.join(".");
    }

Subdomain
  = subdomain:[a-zA-Z0-9]+ ("-" [a-zA-Z0-9]+)* {
      if (subdomain[0] === "-" || subdomain[subdomain.length - 1] === "-") {
        throw new Error("Subdomain must not start or end with a hyphen.");
      }
      return text();
    }