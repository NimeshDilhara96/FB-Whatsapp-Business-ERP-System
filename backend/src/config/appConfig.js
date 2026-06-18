export const appConfig = {
  isMultiTenant:
    process.env.IS_MULTI_TENANT === "true",

  defaultTenantId:
    process.env.DEFAULT_TENANT_ID || "default-company",
};