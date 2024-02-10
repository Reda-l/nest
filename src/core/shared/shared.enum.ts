export enum STATUS_OPTIONS {
  NEW = 'NEW',
  VALIDATION = 'VALIDATION',
  VALIDATED = 'VALIDATED',
  REJECTED = 'REJECTED',
  DISABLED = 'DISABLED',
}

export enum APPOINTMENT_STATUS_OPTIONS {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELED = 'CANCELED',
  DONE = 'DONE',
  PAYED = 'PAYED'
}

export enum APPOINTMENT_SOURCE {
  WHATSAPP = 'WHATSAPP',
  WEBSITE = 'WEBSITE',
  LOCAL = 'LOCAL',
  OTHER = 'OTHER'
}

export enum GENDER_OPTIONS {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export function validateEmail(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}


