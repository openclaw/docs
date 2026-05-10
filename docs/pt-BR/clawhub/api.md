---
read_when:
    - Criando clientes de API
    - Adicionando endpoints ou esquemas
summary: Visão geral e convenções da API REST pública (v1).
x-i18n:
    generated_at: "2026-05-10T19:24:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: ca750027e4077f907a5590e4e28bde896c1f74b65a9ca39a79274b97e5de6148
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Base: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Reutilização do catálogo público

Você pode criar um catálogo, diretório ou superfície de busca de terceiros com base nas APIs públicas de leitura do ClawHub. Metadados públicos de Skills e arquivos de Skills são publicados sob as regras de licença de Skills do ClawHub, enquanto a própria API tem limite de taxa e deve ser consumida com responsabilidade.

Diretrizes:

- Use endpoints públicos de leitura, como `GET /api/v1/skills`, `GET /api/v1/search` e `GET /api/v1/skills/{slug}`, para listagens de catálogo.
- Armazene respostas em cache e respeite `429`, `Retry-After` e cabeçalhos de limite de taxa em vez de fazer polling agressivamente.
- Inclua link para a URL canônica de Skill do ClawHub ao exibir listagens, para que os usuários possam inspecionar o registro de origem no registro.
- Use URLs de página canônicas no formato `https://clawhub.ai/<owner>/<slug>`.
- Não dê a entender que o ClawHub endossa, verifica ou opera o site de terceiros.
- Não espelhe conteúdo oculto, privado ou bloqueado por moderação contornando filtros da API pública ou limites de autenticação.

## Autenticação

- Leitura pública: nenhum token necessário.
- Escrita + conta: `Authorization: Bearer clh_...`.

## Limites de taxa

Aplicação ciente de autenticação:

- Solicitações anônimas: por IP.
- Solicitações autenticadas (token Bearer válido): por bucket de usuário.
- Token ausente/inválido volta para a aplicação por IP.

- Leitura: 600/min por IP, 2400/min por chave
- Escrita: 45/min por IP, 180/min por chave

Cabeçalhos: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After` (em 429).

Semântica:

- `X-RateLimit-Reset`: segundos desde a época Unix (hora absoluta de redefinição)
- `RateLimit-Reset`: segundos de atraso até a redefinição
- `Retry-After`: segundos de atraso a aguardar em `429`

Exemplo `429`:

```http
HTTP/2 429
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34
```

Tratamento pelo cliente:

- Prefira `Retry-After` quando presente.
- Caso contrário, use `RateLimit-Reset` ou derive o atraso de `X-RateLimit-Reset`.
- Adicione jitter às novas tentativas.

## Endpoints

Leitura pública:

- `GET /api/v1/search?q=...`
  - Filtros opcionais: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Alias legado: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (padrão), `createdAt` (`newest`), `downloads`, `stars` (`rating`), `installsCurrent` (`installs`), `installsAllTime`, `trending`
  - `cursor` aplica-se a ordenações não `trending`
  - Filtro opcional: `nonSuspiciousOnly=true`
  - Alias legado: `nonSuspicious=true`
  - Com `nonSuspiciousOnly=true`, páginas baseadas em cursor podem conter menos de `limit` itens; use `nextCursor` para continuar.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

Autenticação necessária:

- `POST /api/v1/skills` (publicar, multipart preferido)
- `DELETE /api/v1/skills/{slug}`
- `DELETE /api/v1/packages/{name}`
- `POST /api/v1/skills/{slug}/undelete`
- `POST /api/v1/skills/{slug}/rename`
- `POST /api/v1/skills/{slug}/merge`
- `POST /api/v1/skills/{slug}/transfer`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

Somente admin:

- `POST /api/v1/users/reserve` reserva slugs raiz e espaços reservados privados de pacotes sem lançamento para um identificador de proprietário.

## Legado

Legados `/api/*` e `/api/cli/*` ainda disponíveis. Consulte `DEPRECATIONS.md`.
