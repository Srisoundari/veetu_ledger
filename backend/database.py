import ssl
import httpx
from supabase import create_client, Client
from dotenv import load_dotenv
import os

load_dotenv()

# Python 3.13 on Windows: OpenSSL rejects Supabase's cert as "key too weak".
# Build a permissive SSL context and force it into every httpx client.
_ssl_ctx = ssl.create_default_context()
_ssl_ctx.check_hostname = False
_ssl_ctx.verify_mode = ssl.CERT_NONE

_real_client_init = httpx.Client.__init__
_real_async_init = httpx.AsyncClient.__init__


def _client_no_verify(self, *args, **kwargs):
    kwargs["verify"] = _ssl_ctx          # hard override, not setdefault
    _real_client_init(self, *args, **kwargs)


def _async_no_verify(self, *args, **kwargs):
    kwargs["verify"] = _ssl_ctx
    _real_async_init(self, *args, **kwargs)


httpx.Client.__init__ = _client_no_verify
httpx.AsyncClient.__init__ = _async_no_verify

supabase: Client = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_KEY"],
)
