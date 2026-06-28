---
read_when:
    - Adicionar/alterar endpoints
    - Depuração de solicitações CLI ↔ registry
summary: Referência da API HTTP (endpoints públicos + CLI + autenticação).
x-i18n:
    generated_at: "2026-06-28T05:06:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

URL base: `https://clawhub.ai` (padrão).

Todos os caminhos v1 ficam em `/api/v1/...`.
Os caminhos legados `/api/...` e `/api/cli/...` permanecem por compatibilidade (consulte `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Reutilização do catálogo público

Diretórios de terceiros podem usar os endpoints públicos de leitura para listar ou pesquisar Skills do ClawHub. Armazene os resultados em cache, respeite `429`/`Retry-After`, direcione os usuários de volta para a listagem canônica do ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) e evite sugerir endosso do ClawHub ao site de terceiros. Não tente espelhar conteúdo oculto, privado ou bloqueado por moderação fora da superfície da API pública.

Atalhos de slug da web são resolvidos entre famílias de registro, mas clientes de API devem usar
as URLs canônicas retornadas por endpoints de leitura em vez de reconstruir a precedência
de rotas.

## Limites de taxa

Modelo de imposição:

- Requisições anônimas: impostas por IP.
- Requisições autenticadas (token Bearer válido): impostas por bucket de usuário.
- Se o token estiver ausente/inválido, o comportamento volta para a imposição por IP.
- Endpoints de escrita autenticados não devem retornar apenas `Unauthorized` quando
  o servidor sabe o motivo. Tokens ausentes, tokens inválidos/revogados e
  contas excluídas/banidas/desativadas devem receber texto acionável para que clientes
  CLI possam informar aos usuários o que os bloqueou.

- Leitura: 3000/min por IP, 12000/min por chave
- Escrita: 300/min por IP, 3000/min por chave
- Download: 1200/min por IP, 6000/min por chave (endpoints de download)

Cabeçalhos:

- Compatibilidade legada: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Padronizados: `RateLimit-Limit`, `RateLimit-Reset`
- Em `429`: `X-RateLimit-Remaining: 0` e `RateLimit-Remaining: 0`
- Em `429`: `Retry-After`

Semântica dos cabeçalhos:

- `X-RateLimit-Reset`: segundos absolutos da época Unix
- `RateLimit-Reset`: segundos até a redefinição (atraso)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: orçamento restante exato quando presente.
  Requisições bem-sucedidas em shards omitem este cabeçalho em vez de retornar um valor global aproximado.
- `Retry-After`: segundos a aguardar antes de tentar novamente (atraso) em `429`

Exemplo de resposta `429`:

```http
HTTP/2 429
content-type: text/plain; charset=utf-8
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34

Rate limit exceeded
```

Orientação para clientes:

- Se `Retry-After` existir, aguarde esse número de segundos antes de tentar novamente.
- Use backoff com jitter para evitar novas tentativas sincronizadas.
- Se `Retry-After` estiver ausente, use `RateLimit-Reset` como fallback (ou calcule a partir de `X-RateLimit-Reset`).

Origem do IP:

- Usa cabeçalhos de IP de cliente confiáveis, incluindo `cf-connecting-ip`, somente quando a
  implantação habilita explicitamente cabeçalhos encaminhados confiáveis.
- O ClawHub usa cabeçalhos de encaminhamento confiáveis para identificar IPs de cliente na borda.
- Se nenhum IP de cliente confiável estiver disponível, requisições anônimas usam buckets de fallback
  escopados apenas pelo tipo de limite de taxa. Esses buckets de fallback não incluem
  caminhos fornecidos pelo chamador, slugs, nomes de pacote, versões, strings de consulta ou outros
  parâmetros de artefato.

## Respostas de erro

As respostas de erro públicas v1 são texto simples com `content-type: text/plain; charset=utf-8`.
Isso inclui falhas de validação (`400`), recursos públicos ausentes (`404`), falhas de autenticação e
permissão (`401`/`403`), limites de taxa (`429`) e downloads bloqueados. Clientes
devem ler o corpo da resposta como uma string legível por humanos. Parâmetros de consulta desconhecidos são
ignorados por compatibilidade, mas parâmetros de consulta reconhecidos com valores inválidos retornam
`400`.

## Endpoints públicos (sem autenticação)

### `GET /api/v1/search`

Parâmetros de consulta:

- `q` (obrigatório): string de consulta
- `limit` (opcional): inteiro
- `highlightedOnly` (opcional): `true` para filtrar para Skills destacadas
- `nonSuspiciousOnly` (opcional): `true` para ocultar Skills suspeitas (`flagged.suspicious`)
- `nonSuspicious` (opcional): alias legado para `nonSuspiciousOnly`

Resposta:

```json
{
  "results": [
    {
      "score": 0.123,
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "version": "1.2.3",
      "updatedAt": 1730000000000,
      "ownerHandle": "openclaw",
      "owner": {
        "handle": "openclaw",
        "displayName": "OpenClaw",
        "image": "https://example.com/avatar.png"
      }
    }
  ]
}
```

Observações:

- Os resultados são retornados em ordem de relevância (similaridade de embeddings + reforços de token exato de slug/nome + um pequeno prior de popularidade).
- A relevância é mais forte que a popularidade. Uma correspondência precisa de slug ou token de nome de exibição pode superar uma correspondência mais vaga com engajamento muito mais forte.
- Texto ASCII é tokenizado em limites de palavras e pontuação. Por exemplo, `personal-map` contém um token autônomo `map`, enquanto `amap-jsapi-skill` contém `amap`, `jsapi` e `skill`; portanto, pesquisar por `map` dá a `personal-map` uma correspondência lexical mais forte que `amap-jsapi-skill`.
- Popularidade é escalada logaritmicamente e limitada. Skills com alto engajamento podem ficar abaixo no ranking quando o texto da consulta tem uma correspondência mais fraca.
- Estado de moderação suspeito ou oculto pode remover uma Skill da pesquisa pública dependendo dos filtros do chamador e do status de moderação atual.

Orientação de descoberta para publicadores:

- Coloque os termos que os usuários literalmente pesquisarão no nome de exibição, no resumo e nas tags. Use um token de slug autônomo somente quando ele também for uma identidade estável que você deseja manter.
- Não renomeie um slug apenas para perseguir uma consulta, a menos que o novo slug seja um nome canônico melhor a longo prazo. Slugs antigos se tornam aliases de redirecionamento, mas a URL canônica, o slug exibido e futuros resumos de pesquisa usam o novo slug.
- Aliases de renomeação preservam a resolução para URLs antigas e instalações que resolvem pelo registro, mas o ranking de pesquisa se baseia nos metadados canônicos da Skill depois que a renomeação for indexada. Estatísticas existentes permanecem com a Skill.
- Se uma Skill estiver inesperadamente invisível, verifique primeiro o estado de moderação com `clawhub inspect @owner/slug` enquanto estiver logado antes de alterar metadados relacionados a ranking.

### `GET /api/v1/skills`

Parâmetros de consulta:

- `limit` (opcional): inteiro (1–200)
- `cursor` (opcional): cursor de paginação para qualquer ordenação que não seja `trending`
- `sort` (opcional): `updated` (padrão), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), aliases legados de instalação `installsCurrent`/`installs`/`installsAllTime` mapeiam para `downloads`, `trending`
- `nonSuspiciousOnly` (opcional): `true` para ocultar Skills suspeitas (`flagged.suspicious`)
- `nonSuspicious` (opcional): alias legado para `nonSuspiciousOnly`

Valores inválidos de `sort` retornam `400`.

Observações:

- `recommended` usa sinais de engajamento e recência.
- `trending` classifica por instalações nos últimos 7 dias (baseado em telemetria).
- `createdAt` é estável para rastreamentos de novas Skills; `updated` muda quando Skills existentes são republicadas.
- Quando `nonSuspiciousOnly=true`, ordenações baseadas em cursor podem retornar menos itens que `limit` em uma página porque Skills suspeitas são filtradas após a recuperação da página.
- Use `nextCursor` para continuar a paginação quando presente. Uma página curta por si só não significa fim dos resultados.

Resposta:

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "topics": ["Productivity"],
      "tags": { "latest": "1.2.3" },
      "stats": {},
      "createdAt": 0,
      "updatedAt": 0,
      "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
      "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] }
    }
  ],
  "nextCursor": null
}
```

### `GET /api/v1/skills/{slug}`

Resposta:

```json
{
  "skill": {
    "slug": "gifgrep",
    "displayName": "GifGrep",
    "summary": "…",
    "topics": ["Productivity"],
    "tags": { "latest": "1.2.3" },
    "stats": {},
    "createdAt": 0,
    "updatedAt": 0
  },
  "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
  "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] },
  "owner": { "handle": "steipete", "displayName": "Peter", "image": null },
  "moderation": {
    "isSuspicious": false,
    "isMalwareBlocked": false,
    "verdict": "clean",
    "reasonCodes": [],
    "summary": null,
    "engineVersion": "v2.0.0",
    "updatedAt": 0
  }
}
```

Observações:

- Slugs antigos criados por fluxos de renomeação/mesclagem de proprietário resolvem para a Skill canônica.
- `metadata.os`: restrições de SO declaradas no frontmatter da Skill (por exemplo, `["macos"]`, `["linux"]`). `null` se não declarado.
- `metadata.systems`: destinos de sistema Nix (por exemplo, `["aarch64-darwin", "x86_64-linux"]`). `null` se não declarado.
- `metadata` é `null` se a Skill não tiver metadados de plataforma.
- `moderation` é incluído somente quando a Skill está sinalizada ou o proprietário a está visualizando.

### `GET /api/v1/skills/{slug}/moderation`

Retorna estado de moderação estruturado.

Resposta:

```json
{
  "moderation": {
    "isSuspicious": true,
    "isMalwareBlocked": false,
    "verdict": "suspicious",
    "reasonCodes": ["suspicious.dynamic_code_execution"],
    "summary": "Detected: suspicious.dynamic_code_execution",
    "engineVersion": "v2.0.0",
    "updatedAt": 0,
    "legacyReason": null,
    "evidence": [
      {
        "code": "suspicious.dynamic_code_execution",
        "severity": "critical",
        "file": "index.ts",
        "line": 3,
        "message": "Dynamic code execution detected.",
        "evidence": ""
      }
    ]
  }
}
```

Observações:

- Proprietários e moderadores podem acessar detalhes de moderação para Skills ocultas.
- Chamadores públicos só recebem `200` para Skills visíveis já sinalizadas.
- Evidências são redigidas para chamadores públicos e só incluem trechos brutos para proprietários/moderadores.

### `POST /api/v1/skills/{slug}/report`

Denuncia uma Skill para análise de moderador. Denúncias são no nível da Skill, opcionalmente vinculadas
a uma versão, e alimentam a fila de denúncias de Skills.

Autenticação:

- Requer um token de API.

Requisição:

```json
{ "reason": "Suspicious install step", "version": "1.2.3" }
```

Resposta:

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "reportId": "skillReports:...",
  "skillId": "skills:...",
  "reportCount": 1
}
```

### `GET /api/v1/skills/-/reports`

Endpoint de moderador/admin para entrada de denúncias de Skills.

Parâmetros de consulta:

- `status` (opcional): `open` (padrão), `confirmed`, `dismissed` ou `all`
- `limit` (opcional): inteiro (1-200)
- `cursor` (opcional): cursor de paginação

Resposta:

```json
{
  "items": [
    {
      "reportId": "skillReports:...",
      "skillId": "skills:...",
      "skillVersionId": "skillVersions:...",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "version": "1.2.3",
      "reason": "Suspicious install step",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/skills/-/reports/{reportId}/triage`

Endpoint de moderador/admin para resolver ou reabrir denúncias de Skills.

Requisição:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` é obrigatório para `confirmed` e `dismissed`; ele pode ser omitido ao
definir `status` de volta para `open`. Passe `finalAction: "hide"` com uma denúncia triada
para ocultar a Skill no mesmo fluxo de trabalho auditável.

### `GET /api/v1/skills/{slug}/versions`

Parâmetros de consulta:

- `limit` (opcional): inteiro
- `cursor` (opcional): cursor de paginação

### `GET /api/v1/skills/{slug}/versions/{version}`

Retorna metadados da versão + lista de arquivos.

- `version.security` inclui status normalizado de verificação de varredura e detalhes do scanner
  (VirusTotal + LLM), quando disponíveis.

### `GET /api/v1/skills/{slug}/scan`

Retorna detalhes de verificação de varredura de segurança para uma versão de Skill.

Parâmetros de consulta:

- `version` (opcional): string de versão específica.
- `tag` (opcional): resolve uma versão marcada (por exemplo, `latest`).

Observações:

- Se nem `version` nem `tag` forem fornecidos, usa a versão mais recente.
- Inclui o status de verificação normalizado mais detalhes específicos do scanner.
- `security.hasScanResult` é `true` somente quando um scanner produziu um veredito definitivo (`clean`, `suspicious` ou `malicious`).
- `moderation` é um snapshot atual de moderação no nível da Skill derivado da versão mais recente.
- Ao consultar uma versão histórica, verifique `moderation.matchesRequestedVersion` e `moderation.sourceVersion` antes de tratar `moderation` e `security` como o mesmo contexto de versão.

### `POST /api/v1/skills/-/scan`

Endpoint autenticado de envio para novos trabalhos do ClawScan.

Scans de upload local não são mais aceitos. Requisições usando
`multipart/form-data` ou `{ "source": { "kind": "upload" } }` retornam `410`.

Scans publicados usam JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Observações:

- Payloads de requisição de scan e relatórios baixáveis expiram do armazenamento de requisições de scan após a janela de retenção.
- Scans publicados exigem acesso de gerenciamento de proprietário/publicador ou autoridade de moderador/administrador da plataforma.
- Scans publicados gravam de volta somente quando `update: true` e o scan é concluído com sucesso.
- A resposta é `202` com `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Trabalhos de scan são assíncronos. Requisições de scan manuais têm prioridade sobre trabalho normal de publicação/backfill, mas a conclusão ainda depende da disponibilidade dos workers.

### `GET /api/v1/skills/-/scan/{scanId}`

Endpoint autenticado de consulta para um scan enviado.

- Retorna status queued/running/succeeded/failed.
- Retorna `queue.queuedAhead` e `queue.position` enquanto estiver na fila, para que clientes possam mostrar quantos scans manuais priorizados estão à frente da requisição. Filas muito grandes são limitadas e relatadas com `queuedAheadIsEstimate: true`.
- Quando disponível, `report` contém seções `clawscan`, `skillspector`, `staticAnalysis` e `virustotal`.
- Trabalhos de scan com falha retornam `status: "failed"` com `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Endpoint autenticado de arquivo de relatório.

- Exige um scan concluído com sucesso; scans não terminais retornam `409`.
- Retorna um ZIP com `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` e `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Endpoint autenticado de arquivo de relatório armazenado para versões enviadas.

- Exige acesso de gerenciamento de proprietário/publicador à Skill ou Plugin, ou autoridade de moderador/administrador da plataforma.
- Retorna resultados de scan armazenados para a versão exata enviada, incluindo versões bloqueadas ou ocultas.
- `kind` usa `skill` por padrão; use `kind=plugin` para scans de Plugin/pacote.
- Retorna o mesmo formato de ZIP dos downloads de requisição de scan.

### `POST /api/v1/skills/-/scan/batch`

Rota canônica de novo scan em lote somente para administradores. Ela aceita o mesmo formato de payload que o legado `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Rota canônica de status em lote somente para administradores. Ela aceita `{ "jobIds": ["..."] }` e retorna os mesmos contadores agregados que o legado `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Retorna o envelope de verificação do Skill Card usado por `clawhub skill verify`.

Parâmetros de consulta:

- `version` (opcional): string de versão específica.
- `tag` (opcional): resolve uma versão marcada (por exemplo, `latest`).

Observações:

- `ok` é `true` somente quando a versão selecionada tem um Skill Card gerado, não está bloqueada como malware pela moderação e a verificação do ClawScan está limpa.
- Identidade da Skill, identidade do publicador e metadados da versão selecionada são campos de envelope de nível superior (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) para que automações de shell possam lê-los sem desempacotar wrappers aninhados.
- `security` é o veredito de ClawScan/segurança de nível superior. A automação deve se basear em `ok`, `decision`, `reasons` e `security.status`.
- `security.signals` contém evidências de suporte de scanners, como `staticScan`, `virusTotal` e `skillSpector`.
- `security.signals.dependencyRegistry` é mantido para compatibilidade da resposta v1, mas o scanner de existência do registro de dependências foi aposentado e esta chave é sempre `null`.
- `provenance` é `server-resolved-github-import` somente quando o ClawHub resolveu e armazenou um repositório/ref/commit/caminho do GitHub durante publicação ou importação; caso contrário, é `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Retorna vereditos de segurança compactos atuais para versões exatas de Skills. Este
endpoint de coleção é destinado a clientes que já sabem quais versões de Skills
do ClawHub instaladas precisam exibir, como a OpenClaw Control UI.

Requisição:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Observações:

- `items` deve conter de 1 a 100 pares `{ slug, version }` únicos.
- Os resultados são por item; uma Skill ou versão ausente não faz a resposta inteira falhar.
- A resposta é apenas de segurança. Ela não inclui dados do Skill Card, status do card gerado, listas de arquivos de artefatos nem payloads detalhados de scanner.
- `security.signals` contém apenas evidências de suporte no nível de status; use `/scan` ou a página de auditoria de segurança do ClawHub para detalhes completos dos scanners.
- `security.signals.dependencyRegistry` é mantido para compatibilidade da resposta v1, mas o scanner de existência do registro de dependências foi aposentado e esta chave é sempre `null`.
- A ausência de Skill Card não afeta `ok`, `decision` nem `reasons` deste endpoint; clientes devem ler o `skill-card.md` instalado localmente quando precisarem do conteúdo do card.
- Use `/verify` quando precisar do envelope de verificação do Skill Card de uma única Skill, `/card` quando precisar do markdown do card gerado e `/scan` quando precisar de dados detalhados de scanner.

Resposta:

```json
{
  "schema": "clawhub.skill.security-verdicts.v1",
  "items": [
    {
      "ok": true,
      "decision": "pass",
      "reasons": [],
      "requestedSlug": "gifgrep",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "publisherHandle": "steipete",
      "publisherDisplayName": "Peter",
      "requestedVersion": "1.2.3",
      "version": "1.2.3",
      "createdAt": 0,
      "checkedAt": 0,
      "skillUrl": "https://clawhub.ai/steipete/skills/gifgrep",
      "securityAuditUrl": "https://clawhub.ai/steipete/skills/gifgrep/security-audit?version=1.2.3",
      "security": {
        "status": "clean",
        "passed": true,
        "signals": {
          "staticScan": { "status": "clean", "reasonCodes": [] },
          "virusTotal": null,
          "skillSpector": null,
          "dependencyRegistry": null
        }
      }
    },
    {
      "ok": false,
      "decision": "fail",
      "reasons": ["version.not_found"],
      "requestedSlug": "missing-version",
      "requestedVersion": "1.0.0",
      "error": { "code": "version_not_found", "message": "Version not found" },
      "security": null
    }
  ]
}
```

### `GET /api/v1/skills/{slug}/file`

Retorna conteúdo de texto bruto.

Parâmetros de consulta:

- `path` (obrigatório)
- `version` (opcional)
- `tag` (opcional)

Observações:

- Usa a versão mais recente por padrão.
- Limite de tamanho do arquivo: 200KB.

### `GET /api/v1/packages`

Endpoint de catálogo unificado para:

- Skills
- plugins de código
- plugins de bundle

Parâmetros de consulta:

- `limit` (opcional): inteiro (1–100)
- `cursor` (opcional): cursor de paginação
- `family` (opcional): `skill`, `code-plugin` ou `bundle-plugin`
- `channel` (opcional): `official`, `community` ou `private`
- `isOfficial` (opcional): `true` ou `false`
- `sort` (opcional): `updated` (padrão), `recommended`, `trending`, `downloads`, alias legado `installs`
- `category` (opcional): filtro de categoria de plugin. Compatível somente quando a
  requisição está escopada para pacotes de plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` ou endpoints de pacote com
  `family=code-plugin`/`family=bundle-plugin`). Categorias controladas e
  aliases legados de filtro v1 estão documentados em `GET /api/v1/plugins`.

Observações:

- Valores inválidos para `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` ou `sort` retornam `400`. Parâmetros de consulta desconhecidos são ignorados.
- `GET /api/v1/code-plugins` e `GET /api/v1/bundle-plugins` continuam sendo aliases de família fixa.
- Entradas de Skills continuam baseadas no registro de Skills e ainda só podem ser publicadas por meio de `POST /api/v1/skills`.
- `POST /api/v1/packages` ainda é somente para versões de code-plugin e bundle-plugin.
- Chamadores anônimos veem apenas canais de pacote públicos.
- Chamadores autenticados podem ver pacotes privados de publicadores aos quais pertencem nos resultados de lista/pesquisa.
- `channel=private` retorna apenas pacotes que o chamador autenticado pode ler.

### `GET /api/v1/packages/search`

Pesquisa de catálogo unificada em Skills + pacotes de plugin.

Parâmetros de consulta:

- `q` (obrigatório): string de consulta
- `limit` (opcional): inteiro (1–100)
- `family` (opcional): `skill`, `code-plugin` ou `bundle-plugin`
- `channel` (opcional): `official`, `community` ou `private`
- `isOfficial` (opcional): `true` ou `false`
- `category` (opcional): filtro de categoria de plugin. Compatível somente quando a
  requisição está escopada para pacotes de plugin. Categorias controladas e aliases legados de filtro v1
  estão documentados em `GET /api/v1/plugins`.

Observações:

- Valores inválidos para `family`, `channel`, `isOfficial`, `featured` ou
  `highlightedOnly` retornam `400`. Parâmetros de consulta desconhecidos são ignorados.
- Chamadores anônimos veem apenas canais de pacote públicos.
- Chamadores autenticados podem pesquisar pacotes privados de publicadores aos quais pertencem.
- `channel=private` retorna apenas pacotes que o chamador autenticado pode ler.

### `GET /api/v1/plugins`

Navegação de catálogo somente de plugins entre pacotes code-plugin e bundle-plugin.

Parâmetros de consulta:

- `limit` (opcional): inteiro (1-100)
- `cursor` (opcional): cursor de paginação
- `isOfficial` (opcional): `true` ou `false`
- `sort` (opcional): `recommended` (padrão), `trending`, `downloads`, `updated`, alias legado `installs`
- `category` (opcional): filtro de categoria de plugin. Valores atuais:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Aliases legados de filtro v1 continuam aceitos em endpoints de leitura:

- `mcp-tooling`, `data` e `automation` resolvem para `tools`.
- `observability` e `deployment` resolvem para `gateway`.
- `dev-tools` resolve para `runtime`.

`trending` é um ranking de instalações/downloads de sete dias e não usa totais históricos.
No endpoint unificado `/api/v1/packages`, ele é somente para plugins; use
`/api/v1/skills?sort=trending` para o catálogo de Skills.

Aliases legados não são aceitos como valores de categoria armazenados ou declarados pelo autor.

### `GET /api/v1/skills/export`

Exportação em massa das Skills públicas mais recentes para análise offline.

Autenticação:

- Token de API obrigatório.

Parâmetros de consulta:

- `startDate` (obrigatório): limite inferior em milissegundos Unix para `updatedAt` da Skill.
- `endDate` (obrigatório): limite superior em milissegundos Unix para `updatedAt` da Skill.
- `limit` (opcional): inteiro (1-250), padrão `250`.
- `cursor` (opcional): cursor de paginação da resposta anterior.

Resposta:

- Corpo: arquivo ZIP.
- Cada Skill exportada tem raiz em `{publisher}/{slug}/`.
- Skills hospedadas incluem os arquivos da versão armazenada mais recente e são listadas em
  `_manifest.json` com `sourceRef: "public-clawhub"`.
- Skills atuais baseadas no GitHub com uma varredura `clean` ou `suspicious` incluem
  `_source_handoff.json` com `sourceRef: "public-github"`, repositório, commit, caminho,
  hash de conteúdo e URL do arquivo. Elas não incluem arquivos-fonte hospedados no ClawHub.
- Cada Skill inclui `_export_skill_meta.json`.
- `_manifest.json` é sempre incluído na raiz do ZIP.
- `_errors.json` é incluído quando Skills ou arquivos individuais não puderam ser
  exportados.

Cabeçalhos:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Exportação em lote dos lançamentos públicos mais recentes de plugins para análise offline.

Autenticação:

- Token de API obrigatório.

Parâmetros de consulta:

- `startDate` (obrigatório): limite inferior em milissegundos Unix para `updatedAt` do plugin.
- `endDate` (obrigatório): limite superior em milissegundos Unix para `updatedAt` do plugin.
- `limit` (opcional): inteiro (1-250), padrão `250`.
- `cursor` (opcional): cursor de paginação da resposta anterior.
- `family` (opcional): `code-plugin` ou `bundle-plugin`. Omitido significa ambas
  as famílias de plugins.

Resposta:

- Corpo: arquivo ZIP.
- Cada plugin exportado tem raiz em `{family}/{packageName}/`.
- Cada plugin exportado inclui os arquivos armazenados do lançamento mais recente.
- Os metadados de exportação por plugin são armazenados em
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` é sempre incluído na raiz do ZIP.
- `_errors.json` é incluído quando plugins ou arquivos individuais não puderam ser
  exportados.

Cabeçalhos:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Busca somente de plugins em pacotes code-plugin e bundle-plugin.

Parâmetros de consulta:

- `q` (obrigatório): string de consulta
- `limit` (opcional): inteiro (1-100)
- `isOfficial` (opcional): `true` ou `false`
- `category` (opcional): filtro de categoria de plugin. Valores atuais:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Observações:

- Os aliases de filtro legados da v1 documentados em `GET /api/v1/plugins` também são
  aceitos.
- A filtragem por categoria é um filtro real de API apoiado por linhas de resumo
  de categoria de plugin, não uma reescrita da consulta de busca.
- Os resultados são retornados em ordem de relevância e atualmente não são paginados.
- Os controles de ordenação da interface do navegador para busca de plugins reordenam os resultados de relevância carregados,
  correspondendo ao comportamento atual de navegação de `/skills`.

### `GET /api/v1/packages/{name}`

Retorna metadados detalhados do pacote.

Observações:

- Skills também podem ser resolvidas por esta rota no catálogo unificado.
- Pacotes privados retornam `404`, a menos que o chamador possa ler o publicador proprietário.

### `DELETE /api/v1/packages/{name}`

Exclui logicamente um pacote e todos os lançamentos.

Observações:

- Requer um token de API do proprietário do pacote, de um proprietário/administrador do publicador da organização,
  moderador da plataforma ou administrador da plataforma.

### `GET /api/v1/packages/{name}/versions`

Retorna o histórico de versões.

Parâmetros de consulta:

- `limit` (opcional): inteiro (1–100)
- `cursor` (opcional): cursor de paginação

Observações:

- Pacotes privados retornam `404`, a menos que o chamador possa ler o publicador proprietário.

### `GET /api/v1/packages/{name}/versions/{version}`

Retorna uma versão de pacote, incluindo metadados de arquivo, compatibilidade,
verificação, metadados de artefato e dados de varredura.

Observações:

- `version.artifact.kind` é `legacy-zip` para arquivos de pacote do mundo antigo ou
  `npm-pack` para lançamentos baseados em ClawPack.
- Lançamentos ClawPack incluem campos compatíveis com npm `npmIntegrity`, `npmShasum` e
  `npmTarballName`.
- `version.sha256hash` é metadado de compatibilidade obsoleto para clientes antigos. Ele
  calcula o hash dos bytes exatos do ZIP retornado por `/api/v1/packages/{name}/download`.
  Clientes modernos devem usar `version.artifact.sha256`, que identifica o
  artefato canônico do lançamento.
- `version.vtAnalysis`, `version.llmAnalysis` e `version.staticScan` são
  incluídos quando existem dados de varredura.
- Pacotes privados retornam `404`, a menos que o chamador possa ler o publicador proprietário.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Retorna o resumo exato de segurança e confiança do lançamento do pacote para clientes de instalação. Esta é a superfície pública de consumo do OpenClaw para decidir se um lançamento resolvido pode ser instalado.

Autenticação:

- Endpoint de leitura pública. Nenhum token de proprietário, publicador, moderador ou administrador é
  obrigatório.

Resposta:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin"
  },
  "release": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "artifactSha256": "0123456789abcdef...",
    "npmIntegrity": "sha512-...",
    "npmShasum": "0123456789abcdef0123456789abcdef01234567",
    "npmTarballName": "example-plugin-1.2.3.tgz",
    "createdAt": 1730000000000
  },
  "trust": {
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious"],
    "pending": false,
    "stale": false
  }
}
```

Campos da resposta:

- `package.name`, `package.displayName` e `package.family` identificam o
  pacote de registro resolvido.
- `release.releaseId`, `release.version` e `release.createdAt` identificam o
  lançamento exato que foi avaliado.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` e `release.npmTarballName` estão presentes quando conhecidos para
  o artefato do lançamento.
- `trust.scanStatus` é o status efetivo de confiança derivado das entradas do scanner
  e da moderação manual do lançamento.
- `trust.moderationState` é anulável. Ele é `null` quando não existe moderação manual de
  lançamento.
- `trust.blockedFromDownload` é o sinal de bloqueio de instalação. OpenClaw e outros
  clientes de instalação devem bloquear a instalação quando esse valor for `true`, em vez de
  recalcular regras de bloqueio a partir dos campos de scanner ou moderação.
- `trust.reasons` é a lista de explicações voltada ao usuário e para auditoria. Códigos de motivo
  são strings estáveis e compactas, como `manual:quarantined`, `scan:malicious`
  e `package:malicious`.
- `trust.pending` significa que uma ou mais entradas de confiança ainda aguardam conclusão.
- `trust.stale` significa que o resumo de confiança foi calculado a partir de entradas desatualizadas e
  deve ser tratado como exigindo atualização antes de uma decisão de permissão de alta confiança.

Observações:

- Este endpoint é exato por versão. Clientes devem chamá-lo depois de resolver a
  versão do pacote que pretendem instalar, não apenas depois de ler os metadados mais recentes
  do pacote.
- Pacotes privados retornam `404`, a menos que o chamador possa ler o publicador proprietário.
- Este endpoint é intencionalmente mais estreito que endpoints de moderação de proprietário/moderador.
  Ele expõe a decisão de instalação e a explicação pública, não
  identidades de denunciantes, corpos de denúncias, evidências privadas ou linhas do tempo internas de revisão.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Retorna os metadados explícitos do resolvedor de artefato para uma versão de pacote.

Observações:

- Versões legadas de pacote retornam um artefato `legacy-zip` e uma `downloadUrl` ZIP
  legada.
- Versões ClawPack retornam um artefato `npm-pack`, campos de integridade npm, uma
  `tarballUrl` e a URL legada de compatibilidade ZIP.
- Esta é a superfície do resolvedor do OpenClaw; ela evita adivinhar o formato do arquivo a partir
  de uma URL compartilhada.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Baixa o artefato da versão pelo caminho explícito do resolvedor.

Observações:

- Versões ClawPack transmitem os bytes exatos do `.tgz` npm-pack enviado.
- Versões ZIP legadas redirecionam para `/api/v1/packages/{name}/download?version=`.
- Usa o bucket de taxa de download.

### `GET /api/v1/packages/{name}/readiness`

Retorna a prontidão calculada para consumo futuro pelo OpenClaw.

As verificações de prontidão abrangem:

- status de canal oficial
- disponibilidade da versão mais recente
- disponibilidade de artefato ClawPack npm-pack
- resumo do artefato
- proveniência do repositório de origem e do commit
- metadados de compatibilidade com OpenClaw
- alvos de host
- estado de varredura

Resposta:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "isOfficial": true,
    "latestVersion": "1.2.3"
  },
  "ready": false,
  "checks": [
    {
      "id": "clawpack",
      "label": "ClawPack artifact",
      "status": "fail",
      "message": "Latest version is legacy ZIP-only."
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

Endpoint de moderador para listar linhas de migração de plugins oficiais do OpenClaw.

Autenticação:

- Requer um token de API de um usuário moderador ou administrador.

Parâmetros de consulta:

- `phase` (opcional): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` ou
  `all` (padrão).
- `limit` (opcional): inteiro (1-100)
- `cursor` (opcional): cursor de paginação

Resposta:

```json
{
  "items": [
    {
      "migrationId": "officialPluginMigrations:...",
      "bundledPluginId": "core.search",
      "packageName": "@openclaw/search-plugin",
      "packageId": "packages:...",
      "owner": "platform",
      "sourceRepo": "openclaw/openclaw",
      "sourcePath": "plugins/search",
      "sourceCommit": "abc123",
      "phase": "blocked",
      "blockers": ["missing ClawPack"],
      "hostTargetsComplete": true,
      "scanClean": false,
      "moderationApproved": false,
      "runtimeBundlesReady": false,
      "notes": null,
      "createdAt": 1760000000000,
      "updatedAt": 1760000000000
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/migrations`

Endpoint de administrador para criar ou atualizar uma linha de migração de plugin oficial.

Autenticação:

- Requer um token de API de um usuário administrador.

Corpo da requisição:

```json
{
  "bundledPluginId": "core.search",
  "packageName": "@openclaw/search-plugin",
  "owner": "platform",
  "sourceRepo": "openclaw/openclaw",
  "sourcePath": "plugins/search",
  "sourceCommit": "abc123",
  "phase": "blocked",
  "blockers": ["missing ClawPack"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "waiting on publisher upload"
}
```

Observações:

- `bundledPluginId` é normalizado para minúsculas e é a chave de upsert estável.
- `packageName` é normalizado como nome npm; o pacote pode estar ausente para migrações
  planejadas.
- Isto rastreia apenas a prontidão de migração. Não altera o OpenClaw nem gera
  ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Endpoint de moderador/administrador para filas de revisão de lançamentos de pacotes.

Autenticação:

- Requer um token de API de um usuário moderador ou administrador.

Parâmetros de consulta:

- `status` (opcional): `open` (padrão), `blocked`, `manual` ou `all`
- `limit` (opcional): inteiro (1-100)
- `cursor` (opcional): cursor de paginação

Significados dos status:

- `open`: lançamentos suspeitos, maliciosos, pendentes, em quarentena, revogados ou denunciados.
- `blocked`: lançamentos em quarentena, revogados ou maliciosos.
- `manual`: qualquer lançamento com uma substituição manual de moderação.
- `all`: qualquer lançamento com substituição manual, estado de varredura não limpo ou denúncia de pacote.

Resposta:

```json
{
  "items": [
    {
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "channel": "community",
      "isOfficial": false,
      "version": "1.2.3",
      "createdAt": 1730000000000,
      "artifactKind": "npm-pack",
      "scanStatus": "malicious",
      "moderationState": "quarantined",
      "moderationReason": "manual review",
      "sourceRepo": "openclaw/example-plugin",
      "sourceCommit": "abc123",
      "reportCount": 2,
      "lastReportedAt": 1730000001000,
      "reasons": ["manual:quarantined", "scan:malicious", "reports:2"]
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/{name}/report`

Denuncia um pacote para revisão por moderador. Denúncias são em nível de pacote, opcionalmente
vinculadas a uma versão. Elas alimentam a fila de moderação, mas não ocultam automaticamente nem
bloqueiam downloads por si só; moderadores devem usar a moderação de lançamento para
aprovar, colocar em quarentena ou revogar artefatos.

Autenticação:

- Requer um token de API.

Requisição:

```json
{ "reason": "Suspicious native binary", "version": "1.2.3" }
```

Resposta:

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "reportCount": 1
}
```

### `GET /api/v1/packages/reports`

Endpoint de moderador/admin para recebimento de relatórios de pacotes.

Autenticação:

- Requer um token de API para um usuário moderador ou admin.

Parâmetros de consulta:

- `status` (opcional): `open` (padrão), `confirmed`, `dismissed` ou `all`
- `limit` (opcional): inteiro (1-100)
- `cursor` (opcional): cursor de paginação

Resposta:

```json
{
  "items": [
    {
      "reportId": "packageReports:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "reason": "Suspicious native binary",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `GET /api/v1/packages/{name}/moderation`

Endpoint de proprietário/moderador para visibilidade de moderação de pacotes.

Autenticação:

- Requer um token de API para o proprietário do pacote, membro editor, moderador ou
  usuário admin.

Resposta:

```json
{
  "package": {
    "packageId": "packages:...",
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "channel": "community",
    "isOfficial": false,
    "reportCount": 2,
    "lastReportedAt": 1730000001000,
    "scanStatus": "malicious"
  },
  "latestRelease": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "moderationReason": "manual review",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious", "reports:2"],
    "createdAt": 1730000000000
  }
}
```

### `POST /api/v1/packages/reports/{reportId}/triage`

Endpoint de moderador/admin para resolver ou reabrir relatórios de pacotes.

Solicitação:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` é obrigatório para `confirmed` e `dismissed`; pode ser omitido ao
definir `status` de volta para `open`. Passe `finalAction: "quarantine"` ou
`finalAction: "revoke"` com um relatório confirmado para aplicar a moderação da versão no
mesmo fluxo de trabalho auditável.

Resposta:

```json
{
  "ok": true,
  "reportId": "packageReports:...",
  "packageId": "packages:...",
  "status": "confirmed",
  "reportCount": 0
}
```

### `POST /api/v1/packages/{name}/versions/{version}/moderation`

Endpoint de moderador/admin para revisão de versão de pacote.

Solicitação:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Estados compatíveis:

- `approved`: revisado manualmente e permitido.
- `quarantined`: bloqueado enquanto aguarda acompanhamento.
- `revoked`: bloqueado depois que uma versão era anteriormente confiável.

Versões em quarentena e revogadas retornam `403` das rotas de download de artefatos.
Cada alteração grava uma entrada no log de auditoria.

### `GET /api/v1/packages/{name}/file`

Retorna o conteúdo de texto bruto de um arquivo de pacote.

Parâmetros de consulta:

- `path` (obrigatório)
- `version` (opcional)
- `tag` (opcional)

Observações:

- Usa como padrão a versão mais recente.
- Usa o bucket de limite de leitura, não o bucket de download.
- Arquivos binários retornam `415`.
- Limite de tamanho de arquivo: 200 KB.
- Varreduras pendentes do VirusTotal não bloqueiam leituras; versões maliciosas ainda podem ser retidas em outro ponto.
- Pacotes privados retornam `404`, a menos que o chamador possa ler o publisher proprietário.

### `GET /api/v1/packages/{name}/download`

Baixa o arquivo ZIP determinístico legado para uma versão de pacote.

Parâmetros de consulta:

- `version` (opcional)
- `tag` (opcional)

Observações:

- Usa como padrão a versão mais recente.
- Skills redirecionam para `GET /api/v1/download`.
- Arquivos de Plugin/pacote são arquivos zip com uma raiz `package/` para que clientes antigos do OpenClaw
  continuem funcionando.
- Esta rota permanece somente ZIP. Ela não faz streaming de arquivos ClawPack `.tgz`.
- As respostas incluem cabeçalhos `ETag`, `Digest`, `X-ClawHub-Artifact-Type` e
  `X-ClawHub-Artifact-Sha256` para verificações de integridade do resolvedor.
- Metadados somente do registro não são injetados no arquivo baixado.
- Varreduras pendentes do VirusTotal não bloqueiam downloads; versões maliciosas retornam `403`.
- Pacotes privados retornam `404`, a menos que o chamador seja o proprietário.

### `GET /api/npm/{package}`

Retorna um packument compatível com npm para versões de pacote apoiadas por ClawPack.

Observações:

- Somente versões com tarballs npm-pack do ClawPack enviados são listadas.
- Versões legadas somente ZIP são omitidas intencionalmente.
- `dist.tarball`, `dist.integrity` e `dist.shasum` usam campos compatíveis com npm
  para que os usuários possam apontar o npm para o espelho, se quiserem.
- Packuments de pacotes com escopo oferecem suporte tanto ao caminho `/api/npm/@scope/name` quanto ao caminho de solicitação
  codificado do npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Faz streaming dos bytes exatos do tarball ClawPack enviado para clientes de espelho npm.

Observações:

- Usa o bucket de limite de download.
- Os cabeçalhos de download incluem SHA-256 do ClawHub mais metadados de integridade/shasum do npm.
- Verificações de moderação e acesso a pacotes privados ainda se aplicam.

### `GET /api/v1/resolve`

Usado pela CLI para mapear uma impressão digital local para uma versão conhecida.

Parâmetros de consulta:

- `slug` (obrigatório)
- `hash` (obrigatório): sha256 hexadecimal de 64 caracteres da impressão digital do pacote

Resposta:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Baixa um ZIP de versão de Skill hospedada ou retorna uma transferência de origem do GitHub para uma
Skill atual apoiada pelo GitHub com uma varredura `clean` ou `suspicious` e nenhuma versão
hospedada.

Parâmetros de consulta:

- `slug` (obrigatório)
- `version` (opcional): string semver
- `tag` (opcional): nome da tag (por exemplo, `latest`)

Observações:

- Se nem `version` nem `tag` forem fornecidos, a versão mais recente será usada.
- Versões excluídas de forma reversível retornam `410`.
- Transferências de Skills apoiadas pelo GitHub não fazem proxy nem espelham bytes. A resposta JSON
  inclui `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  e `archiveUrl`; o estado de varredura/atual é um gate e não é incluído como metadado de payload
  de sucesso.
- As estatísticas de download são contadas como identidades únicas por dia UTC (`userId` quando o token de API é válido; caso contrário, IP).

## Endpoints de autenticação (token Bearer)

Todos os endpoints exigem:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Valida o token e retorna o handle do usuário.

### `POST /api/v1/skills`

Publica uma nova versão.

- Preferencial: `multipart/form-data` com JSON em `payload` + blobs em `files[]`.
- Corpo JSON com `files` (baseado em storageId) também é aceito.
- Campo opcional de payload: `ownerHandle`. Quando presente, a API resolve esse
  publisher no lado do servidor e exige que o ator tenha acesso ao publisher.
- Campo opcional de payload: `migrateOwner`. Quando `true` com `ownerHandle`, uma
  Skill existente pode mudar para esse proprietário se o ator for admin/proprietário em ambos
  os publishers atual e de destino. Sem essa adesão explícita, mudanças de proprietário são
  rejeitadas.

### `POST /api/v1/packages`

Publica uma versão de code-plugin ou bundle-plugin.

- Requer autenticação por token Bearer.
- Requer `multipart/form-data`.
- Campos de formulário permitidos são `payload`, blobs `files` repetidos ou uma referência de tarball
  `clawpack`. `clawpack` pode ser um blob `.tgz` ou um id de armazenamento retornado pelo
  fluxo de upload-url. Publicações staged com storage-id também devem incluir o
  `clawpackUploadTicket` retornado com essa URL de upload.
- Use `files` ou `clawpack`, nunca ambos na mesma solicitação.
- Corpos JSON e metadados `payload.files` / `payload.artifact`
  fornecidos pelo chamador são rejeitados.
- Solicitações diretas de publicação multipart são limitadas a 18 MB. Tarballs ClawPack podem
  usar o fluxo de upload-url até o limite de 120 MB do tarball.
- Campo opcional de payload: `ownerHandle`. Quando presente, somente admins podem publicar em nome desse proprietário.

Destaques de validação:

- `family` deve ser `code-plugin` ou `bundle-plugin`.
- Pacotes Plugin exigem `openclaw.plugin.json`. Envios `.tgz` do ClawPack devem
  contê-lo em `package/openclaw.plugin.json`.
- Plugins de código exigem `package.json`, metadados do repositório de origem, metadados de commit
  de origem, metadados de schema de configuração, `openclaw.compat.pluginApi` e
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` e `openclaw.environment` são metadados opcionais.
- Somente o publisher da org `openclaw` e os publishers pessoais dos membros atuais da org `openclaw`
  podem publicar no canal `official`.
- Publicações em nome de terceiros ainda validam a elegibilidade para o canal oficial em relação à conta do proprietário de destino.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Exclui de forma reversível / restaura uma Skill (proprietário, moderador ou admin).

Corpo JSON opcional:

```json
{ "reason": "Held for moderation pending legal review." }
```

Quando presente, `reason` é armazenado como a nota de moderação da Skill e copiado para o log de auditoria.
Exclusões reversíveis iniciadas pelo proprietário reservam o slug por 30 dias; depois disso, o slug pode ser reivindicado por
outro publisher. A resposta de exclusão inclui `slugReservedUntil` quando essa expiração se aplica.
Ocultações por moderador/admin e remoções de segurança não expiram dessa forma.

Resposta de exclusão:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Códigos de status:

- `200`: ok
- `401`: não autorizado
- `403`: proibido
- `404`: Skill/usuário não encontrado
- `500`: erro interno do servidor

### `POST /api/v1/users/publisher`

Somente admin. Garante que exista um publisher de org para um handle. Se o handle ainda apontar para um
publisher legado compartilhado de usuário/pessoal, o endpoint primeiro o migra para um publisher de org.
Para uma org recém-criada, forneça `memberHandle`; o admin atuante não é adicionado como membro.
`memberRole` usa como padrão `owner`.

- Corpo: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Resposta: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Criação autenticada e por autoatendimento de publisher de org. Cria um novo publisher de org e adiciona o
chamador como proprietário. Este endpoint não migra handles existentes de usuário/pessoais e não
marca o publisher como confiável/oficial.

- Corpo: `{ "handle": "opik", "displayName": "Opik" }`
- Resposta: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Retorna `409` quando o handle já é usado por um publisher, usuário ou publisher pessoal.

### `POST /api/v1/users/reserve`

Somente admin. Reserva slugs raiz e nomes de pacote para um proprietário legítimo sem publicar uma
versão. Nomes de pacote tornam-se pacotes privados placeholder sem linhas de versão, para que o mesmo
proprietário possa publicar posteriormente a versão real de code-plugin ou bundle-plugin nesse nome.

- Corpo: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Resposta: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Somente admin. Recupera um publisher pessoal para um principal GitHub OAuth substituto verificado
sem editar linhas de conta do Convex Auth. A solicitação deve nomear ambos os ids imutáveis da conta
do provedor GitHub; handles mutáveis são usados apenas como uma proteção voltada ao operador.

O endpoint usa dry-run por padrão. Aplicar a recuperação exige `dryRun: false` e
`confirmIdentityVerified: true` depois que a equipe verificar independentemente a continuidade entre ambos
os principais do GitHub. A recuperação falha de forma fechada quando o publisher pessoal atual do usuário de destino
tem skills, packages ou fontes de skill do GitHub.
A recuperação também migra campos `ownerUserId` legados para as skills do publisher recuperado,
aliases de slug de skill, packages, avisos do inspetor de packages e linhas derivadas de resumo de busca, para que
os caminhos de proprietário direto concordem com a nova autoridade do publisher. Uma reserva ativa de identificador protegido
para o identificador recuperado também é reatribuída ao usuário substituto, para que a sincronização posterior
do perfil não consiga restaurar a autoridade concorrente do usuário anterior. Cada tabela primária é limitada a
100 linhas por transação de aplicação; recuperações maiores devem primeiro usar uma migração de proprietário retomável.
Fontes de skill do GitHub têm escopo de publisher e são relatadas como verificadas, em vez de reescritas.

- Body: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Continuidade da conta verificada para o issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Response: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Continuidade da conta verificada para o issue #2555" }`

### Endpoints de gerenciamento de slug do proprietário

- `POST /api/v1/skills/{slug}/rename`
  - Body: `{ "newSlug": "new-canonical-slug" }`
  - Response: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Body: `{ "targetSlug": "canonical-target-slug" }`
  - Response: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Observações:

- Ambos os endpoints exigem autenticação por token de API e funcionam apenas para o proprietário da skill.
- `rename` preserva o slug anterior como um alias de redirecionamento.
- `merge` oculta a listagem de origem e redireciona o slug de origem para a listagem de destino.

### Endpoints de transferência de propriedade

- `POST /api/v1/skills/{slug}/transfer`
  - Body: `{ "toUserHandle": "target_handle", "message": "opcional" }`
  - Response: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Response (accept/reject/cancel): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Formato da Response: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demonstração" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Bane um usuário e exclui permanentemente as skills de sua propriedade (somente moderador/admin).

Body:

```json
{ "handle": "user_handle", "reason": "motivo opcional do banimento" }
```

ou

```json
{ "userId": "users_...", "reason": "motivo opcional do banimento" }
```

Response:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

Remove o banimento de um usuário e restaura skills qualificadas (somente admin).

Body:

```json
{ "handle": "user_handle", "reason": "motivo opcional para remover o banimento" }
```

ou

```json
{ "userId": "users_...", "reason": "motivo opcional para remover o banimento" }
```

Response:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

Altera o motivo armazenado para um banimento existente sem remover o banimento nem restaurar
conteúdo (somente admin). Usa dry-run por padrão, a menos que `dryRun` seja `false`.

Body:

```json
{ "handle": "user_handle", "reason": "spam de publicação em massa", "dryRun": true }
```

ou

```json
{ "userId": "users_...", "reason": "spam de publicação em massa", "dryRun": false }
```

Response:

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "banimento automático por malware",
  "nextReason": "spam de publicação em massa",
  "changed": true
}
```

### `POST /api/v1/users/role`

Altera a função de um usuário (somente admin).

Body:

```json
{ "handle": "user_handle", "role": "moderator" }
```

ou

```json
{ "userId": "users_...", "role": "admin" }
```

Response:

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

Lista ou pesquisa usuários (somente admin).

Parâmetros de consulta:

- `q` (opcional): consulta de busca
- `query` (opcional): alias para `q`
- `limit` (opcional): máximo de resultados (padrão 20, máximo 200)

Response:

```json
{
  "items": [
    {
      "userId": "users_...",
      "handle": "user_handle",
      "displayName": "Usuário",
      "name": "Usuário",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

Adiciona/remove uma estrela (destaques). Ambos os endpoints são idempotentes.

Responses:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Endpoints de CLI legados (obsoletos)

Ainda compatíveis com versões antigas da CLI:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Consulte `DEPRECATIONS.md` para o plano de remoção.

`POST /api/cli/upload-url` retorna `uploadUrl` e `uploadTicket`. Publicações de package
que preparam um tarball ClawPack devem enviar o id de armazenamento resultante como
`clawpack` e o ticket retornado como `clawpackUploadTicket`.

## Descoberta de registro (`/.well-known/clawhub.json`)

A CLI pode descobrir configurações de registro/autenticação pelo site:

- `/.well-known/clawhub.json` (JSON, preferido)
- `/.well-known/clawdhub.json` (legado)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Se você hospedar por conta própria, sirva este arquivo (ou defina `CLAWHUB_REGISTRY` explicitamente; `CLAWDHUB_REGISTRY` legado).
