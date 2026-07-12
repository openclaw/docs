---
read_when:
    - Criando clientes de API
    - Adicionando endpoints ou esquemas
summary: Visão geral e convenções da API REST pública (v1).
x-i18n:
    generated_at: "2026-07-12T15:02:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Base: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Reutilização do catálogo público

Você pode criar um catálogo, diretório ou mecanismo de busca de terceiros com base nas APIs públicas de leitura do ClawHub. Os metadados e arquivos públicos de Skills são publicados segundo as regras de licença de Skills do ClawHub, enquanto a própria API tem limites de taxa e deve ser utilizada com responsabilidade.

Diretrizes:

- Use endpoints públicos de leitura, como `GET /api/v1/skills`, `GET /api/v1/search` e `GET /api/v1/skills/{slug}`, para listagens de catálogo.
- Armazene as respostas em cache e respeite `429`, `Retry-After` e os cabeçalhos de limite de taxa, em vez de fazer consultas frequentes e agressivas.
- Ao exibir listagens, inclua um link para a URL canônica da Skill no ClawHub, para que os usuários possam consultar o registro no repositório de origem.
- Use URLs de página canônicas no formato `https://clawhub.ai/<owner>/skills/<slug>`.
- Não dê a entender que o ClawHub endossa, verifica ou opera o site de terceiros.
- Não replique conteúdo oculto, privado ou bloqueado pela moderação contornando filtros da API pública ou limites de autenticação.

## Autenticação

- Leitura pública: nenhum token necessário.
- Gravação + conta: `Authorization: Bearer clh_...`.

## Limites de taxa

Aplicação sensível à autenticação:

- Solicitações anônimas: por IP.
- Solicitações autenticadas (token Bearer válido): por cota de usuário.
- Token ausente ou inválido recorre à aplicação por IP.

- Leitura: 3000/min por IP, 12000/min por chave
- Gravação: 300/min por IP, 3000/min por chave
- Download: 1200/min por IP, 6000/min por chave

Cabeçalhos: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining` e `Retry-After` são incluídos em respostas `429`.

Semântica:

- `X-RateLimit-Reset`: segundos da época Unix (horário absoluto de redefinição)
- `RateLimit-Reset`: segundos de espera até a redefinição
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: cota restante exata quando
  presentes; solicitações fragmentadas bem-sucedidas omitem esse valor em vez de retornar um valor
  global aproximado
- `Retry-After`: segundos de espera em caso de `429`

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

Tratamento pelo cliente:

- Dê preferência a `Retry-After` quando estiver presente.
- Caso contrário, use `RateLimit-Reset` ou derive o tempo de espera de `X-RateLimit-Reset`.
- Adicione uma variação aleatória às novas tentativas.

## Erros

- Os erros da v1 são texto simples (`text/plain; charset=utf-8`), incluindo `400`,
  `401`, `403`, `404`, `429` e respostas de download bloqueado.
- Parâmetros de consulta desconhecidos são ignorados por compatibilidade.
- Parâmetros de consulta conhecidos com valores inválidos retornam `400`.

## Endpoints

Leitura pública:

- `GET /api/v1/search?q=...`
  - Filtros opcionais: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Alias legado: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (padrão), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), aliases legados de instalação `installsCurrent`/`installs`/`installsAllTime` são mapeados para `downloads`, `trending`
  - Valores inválidos de `sort` retornam `400`
  - `cursor` aplica-se às ordenações diferentes de `trending`
  - Filtro opcional: `nonSuspiciousOnly=true`
  - Alias legado: `nonSuspicious=true`
  - Com `nonSuspiciousOnly=true`, as páginas baseadas em cursor podem conter menos de `limit` itens; use `nextCursor` para continuar.
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
  - Skills atuais hospedadas no GitHub com uma verificação `clean` ou `suspicious` retornam um
    descritor JSON de encaminhamento `public-github` em vez de bytes do ClawHub.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Skills hospedadas são exportadas como arquivos armazenados.
  - Skills atuais hospedadas no GitHub com uma verificação `clean` ou `suspicious` são exportadas
    como descritores de encaminhamento `public-github`.
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

- `POST /api/v1/skills` (publicação, multipart preferencial)
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

Somente administradores:

- `POST /api/v1/users/reserve` reserva slugs raiz e marcadores privados de pacotes sem versão para um identificador de proprietário.

## Legado

Os endpoints legados `/api/*` e `/api/cli/*` continuam disponíveis. Consulte `DEPRECATIONS.md`.
