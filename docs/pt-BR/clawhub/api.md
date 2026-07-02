---
read_when:
    - Criando clientes de API
    - Adicionando endpoints ou esquemas
summary: Visão geral e convenções da API REST pública (v1).
x-i18n:
    generated_at: "2026-07-02T22:24:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Base: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Reutilização do catálogo público

Você pode criar um catálogo, diretório ou superfície de busca de terceiros sobre as APIs públicas de leitura do ClawHub. Metadados públicos de Skills e arquivos de Skills são publicados sob as regras de licença de Skills do ClawHub, enquanto a API em si é limitada por taxa e deve ser consumida com responsabilidade.

Diretrizes:

- Use endpoints públicos de leitura, como `GET /api/v1/skills`, `GET /api/v1/search` e `GET /api/v1/skills/{slug}`, para listagens de catálogo.
- Armazene respostas em cache e respeite os cabeçalhos `429`, `Retry-After` e de limite de taxa em vez de fazer polling agressivamente.
- Inclua um link de volta para a URL canônica da Skill no ClawHub ao exibir listagens, para que os usuários possam inspecionar o registro de origem no registry.
- Use URLs de página canônicas no formato `https://clawhub.ai/<owner>/skills/<slug>`.
- Não dê a entender que o ClawHub endossa, verifica ou opera o site de terceiros.
- Não espelhe conteúdo oculto, privado ou bloqueado por moderação contornando filtros da API pública ou limites de autenticação.

## Autenticação

- Leitura pública: nenhum token é necessário.
- Escrita + conta: `Authorization: Bearer clh_...`.

## Limites de taxa

Aplicação ciente de autenticação:

- Solicitações anônimas: por IP.
- Solicitações autenticadas (token Bearer válido): por bucket de usuário.
- Token ausente/inválido recai para aplicação por IP.

- Leitura: 3000/min por IP, 12000/min por chave
- Escrita: 300/min por IP, 3000/min por chave
- Download: 1200/min por IP, 6000/min por chave

Cabeçalhos: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining` e `Retry-After` são incluídos em `429`.

Semântica:

- `X-RateLimit-Reset`: segundos desde a época Unix (horário absoluto de redefinição)
- `RateLimit-Reset`: segundos de atraso até a redefinição
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: orçamento restante exato quando
  presente; solicitações bem-sucedidas fragmentadas o omitem em vez de retornar um valor global
  aproximado
- `Retry-After`: segundos de atraso para aguardar em `429`

Exemplo de `429`:

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

Tratamento no cliente:

- Prefira `Retry-After` quando presente.
- Caso contrário, use `RateLimit-Reset` ou derive o atraso de `X-RateLimit-Reset`.
- Adicione jitter às novas tentativas.

## Erros

- Erros da v1 são texto simples (`text/plain; charset=utf-8`), incluindo respostas `400`,
  `401`, `403`, `404`, `429` e de download bloqueado.
- Parâmetros de consulta desconhecidos são ignorados por compatibilidade.
- Parâmetros de consulta conhecidos com valores inválidos retornam `400`.

## Endpoints

Leitura pública:

- `GET /api/v1/search?q=...`
  - Filtros opcionais: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Alias legado: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (padrão), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), aliases de instalação legados `installsCurrent`/`installs`/`installsAllTime` mapeiam para `downloads`, `trending`
  - Valores inválidos de `sort` retornam `400`
  - `cursor` se aplica a ordenações que não sejam `trending`
  - Filtro opcional: `nonSuspiciousOnly=true`
  - Alias legado: `nonSuspicious=true`
  - Com `nonSuspiciousOnly=true`, páginas baseadas em cursor podem conter menos itens que `limit`; use `nextCursor` para continuar.
  - `recommended` usa sinais de engajamento e recência.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Skills hospedadas retornam bytes ZIP determinísticos.
  - Skills atuais baseadas no GitHub com uma verificação `clean` ou `suspicious` retornam um
    descritor de transferência JSON `public-github` em vez de bytes do ClawHub.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Skills hospedadas são exportadas como arquivos armazenados.
  - Skills atuais baseadas no GitHub com uma verificação `clean` ou `suspicious` são exportadas
    como descritores de transferência `public-github`.
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (padrão), `recommended`, `downloads`, alias legado `installs`
  - Valores inválidos de `sort` retornam `400`
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (padrão), `downloads`, `updated`, alias legado `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

Autenticação obrigatória:

- `POST /api/v1/skills` (publicação, multipart preferido)
- `DELETE /api/v1/skills/{slug}`
- `DELETE /api/v1/packages/{name}`
- `POST /api/v1/skills/{slug}/undelete`
- `POST /api/v1/packages/{name}/undelete`
- `POST /api/v1/skills/{slug}/rename`
- `POST /api/v1/skills/{slug}/merge`
- `POST /api/v1/skills/{slug}/transfer`
- `POST /api/v1/packages/{name}/transfer`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
- `GET /api/v1/plugins/export?startDate=&endDate=&limit=&cursor=&family=`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

Somente administrador:

- `POST /api/v1/users/reserve` reserva slugs raiz e espaços reservados privados de pacotes sem release para um identificador de proprietário.

## Legado

Legado `/api/*` e `/api/cli/*` ainda disponíveis. Consulte `DEPRECATIONS.md`.
