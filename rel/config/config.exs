import Config
import System, only: [get_env: 1]

config :arc,
  storage: Arc.Storage.GCS,
  bucket: get_env("GCS_BUCKET")

config :piazza_core, aes_key: get_env("AES_KEY")

if get_env("PLURAL_CLIENT_ID") do
  config :console,
    plural_login: true
  config :console, :oidc_providers,
    plural: [
      discovery_document_uri: "https://oidc.plural.sh/.well-known/openid-configuration",
      client_id: get_env("PLURAL_CLIENT_ID"),
      client_secret: get_env("PLURAL_CLIENT_SECRET"),
      redirect_uri: "https://#{get_env("HOST")}/oauth/callback",
      response_type: "code",
      scope: "profile"
    ]
end
