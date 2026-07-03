---
read_when:
    - Adicionando/alterando endpoints
    - Depuração de solicitações CLI ↔ registro
summary: Referência da API HTTP (endpoints públicos + CLI + autenticação).
x-i18n:
    generated_at: "2026-07-03T00:53:42Z"
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
Os legados `/api/...` e `/api/cli/...` permanecem para compatibilidade (consulte `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Reuso do catálogo público

Diretórios de terceiros podem usar os endpoints públicos de leitura para listar ou pesquisar Skills do ClawHub. Armazene os resultados em cache, respeite `429`/`Retry-After`, direcione os usuários de volta para a listagem canônica do ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) e evite sugerir endosso do ClawHub ao site de terceiros. Não tente espelhar conteúdo oculto, privado ou bloqueado por moderação fora da superfície da API pública.

Atalhos de slug da Web são resolvidos entre famílias de registro, mas clientes de API devem usar
as URLs canônicas retornadas pelos endpoints de leitura em vez de reconstruir a precedência
de rotas.

## Limites de taxa

Modelo de aplicação:

- Solicitações anônimas: aplicadas por IP.
- Solicitações autenticadas (token Bearer válido): aplicadas por bucket de usuário.
- Se o token estiver ausente/inválido, o comportamento volta para a aplicação por IP.
- Endpoints de escrita autenticados não devem retornar um `Unauthorized` puro quando
  o servidor conhece o motivo. Tokens ausentes, tokens inválidos/revogados e
  contas excluídas/banidas/desativadas devem receber textos acionáveis para que clientes
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
  Solicitações bem-sucedidas fragmentadas omitem este cabeçalho em vez de retornar um valor global aproximado.
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

- Se `Retry-After` existir, aguarde essa quantidade de segundos antes de tentar novamente.
- Use recuo com jitter para evitar novas tentativas sincronizadas.
- Se `Retry-After` estiver ausente, recorra a `RateLimit-Reset` (ou calcule a partir de `X-RateLimit-Reset`).

Origem do IP:

- Usa cabeçalhos confiáveis de IP do cliente, incluindo `cf-connecting-ip`, somente quando a
  implantação habilita explicitamente cabeçalhos encaminhados confiáveis.
- ClawHub usa cabeçalhos de encaminhamento confiáveis para identificar IPs de clientes na borda.
- Se nenhum IP confiável do cliente estiver disponível, solicitações anônimas usam buckets de fallback
  delimitados apenas pelo tipo de limite de taxa. Esses buckets de fallback não incluem
  caminhos fornecidos pelo chamador, slugs, nomes de pacotes, versões, strings de consulta ou outros
  parâmetros de artefato.

## Respostas de erro

Respostas públicas de erro v1 são texto simples com `content-type: text/plain; charset=utf-8`.
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
- `highlightedOnly` (opcional): `true` para filtrar para Skills destacados
- `nonSuspiciousOnly` (opcional): `true` para ocultar Skills suspeitos (`flagged.suspicious`)
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

- Os resultados são retornados em ordem de relevância (similaridade de embedding + reforços por token exato de slug/nome + um pequeno prior de popularidade).
- A relevância é mais forte que a popularidade. Uma correspondência precisa de slug ou token de nome de exibição pode superar uma correspondência mais ampla com engajamento muito maior.
- Texto ASCII é tokenizado em limites de palavras e pontuação. Por exemplo, `personal-map` contém um token `map` independente, enquanto `amap-jsapi-skill` contém `amap`, `jsapi` e `skill`; portanto, pesquisar por `map` dá a `personal-map` uma correspondência lexical mais forte que `amap-jsapi-skill`.
- A popularidade é escalada logaritmicamente e limitada. Skills com alto engajamento podem ficar abaixo quando o texto da consulta tem uma correspondência mais fraca.
- Estado de moderação suspeito ou oculto pode remover um Skill da pesquisa pública dependendo dos filtros do chamador e do status atual de moderação.

Orientação de descoberta para publicadores:

- Coloque os termos que os usuários literalmente pesquisarão no nome de exibição, no resumo e nas tags. Use um token de slug independente apenas quando ele também for uma identidade estável que você deseja manter.
- Não renomeie um slug apenas para perseguir uma consulta, a menos que o novo slug seja um nome canônico melhor a longo prazo. Slugs antigos se tornam aliases de redirecionamento, mas a URL canônica, o slug exibido e os futuros resumos de pesquisa usam o novo slug.
- Aliases de renomeação preservam a resolução para URLs antigas e instalações resolvidas pelo registro, mas o ranking de pesquisa se baseia nos metadados canônicos do Skill depois que a renomeação foi indexada. Estatísticas existentes permanecem com o Skill.
- Se um Skill estiver inesperadamente invisível, verifique primeiro o estado de moderação com `clawhub inspect @owner/slug` enquanto estiver conectado antes de alterar metadados relacionados ao ranking.

### `GET /api/v1/skills`

Parâmetros de consulta:

- `limit` (opcional): inteiro (1–200)
- `cursor` (opcional): cursor de paginação para qualquer ordenação que não seja `trending`
- `sort` (opcional): `updated` (padrão), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), aliases legados de instalação `installsCurrent`/`installs`/`installsAllTime` mapeiam para `downloads`, `trending`
- `nonSuspiciousOnly` (opcional): `true` para ocultar Skills suspeitos (`flagged.suspicious`)
- `nonSuspicious` (opcional): alias legado para `nonSuspiciousOnly`

Valores inválidos de `sort` retornam `400`.

Observações:

- `recommended` usa sinais de engajamento e recência.
- `trending` classifica por instalações nos últimos 7 dias (com base em telemetria).
- `createdAt` é estável para rastreamentos de novos Skills; `updated` muda quando Skills existentes são republicados.
- Quando `nonSuspiciousOnly=true`, ordenações baseadas em cursor podem retornar menos de `limit` itens em uma página porque Skills suspeitos são filtrados após a recuperação da página.
- Use `nextCursor` para continuar a paginação quando presente. Uma página curta não significa, por si só, fim dos resultados.

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

- Slugs antigos criados por fluxos de renomeação/mesclagem de proprietário resolvem para o Skill canônico.
- `metadata.os`: restrições de OS declaradas no frontmatter do Skill (por exemplo, `["macos"]`, `["linux"]`). `null` se não declarado.
- `metadata.systems`: alvos de sistema Nix (por exemplo, `["aarch64-darwin", "x86_64-linux"]`). `null` se não declarado.
- `metadata` é `null` se o Skill não tiver metadados de plataforma.
- `moderation` é incluído somente quando o Skill está sinalizado ou o proprietário está visualizando-o.

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

- Proprietários e moderadores podem acessar detalhes de moderação para Skills ocultos.
- Chamadores públicos só recebem `200` para Skills visíveis já sinalizados.
- Evidências são redigidas para chamadores públicos e incluem trechos brutos apenas para proprietários/moderadores.

### `POST /api/v1/skills/{slug}/report`

Reporte um Skill para revisão por moderador. Relatórios são no nível do Skill, opcionalmente vinculados
a uma versão, e alimentam a fila de relatórios de Skills.

Autenticação:

- Requer um token de API.

Solicitação:

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

Endpoint de moderador/admin para entrada de relatórios de Skills.

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

Endpoint de moderador/admin para resolver ou reabrir relatórios de Skills.

Solicitação:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` é obrigatório para `confirmed` e `dismissed`; ele pode ser omitido ao
definir `status` de volta para `open`. Passe `finalAction: "hide"` com um relatório
triado para ocultar o Skill no mesmo fluxo de trabalho auditável.

### `GET /api/v1/skills/{slug}/versions`

Parâmetros de consulta:

- `limit` (opcional): inteiro
- `cursor` (opcional): cursor de paginação

### `GET /api/v1/skills/{slug}/versions/{version}`

Retorna metadados da versão + lista de arquivos.

- `version.security` inclui status de verificação de varredura normalizado e detalhes do scanner
  (VirusTotal + LLM), quando disponíveis.

### `GET /api/v1/skills/{slug}/scan`

Retorna detalhes de verificação de varredura de segurança para uma versão do Skill.

Parâmetros de consulta:

- `version` (opcional): string de versão específica.
- `tag` (opcional): resolve uma versão marcada (por exemplo, `latest`).

Observações:

- Se nem `version` nem `tag` forem fornecidos, usa a versão mais recente.
- Inclui status de verificação normalizado, além de detalhes específicos do scanner.
- `security.hasScanResult` é `true` somente quando um scanner produziu um veredito definitivo (`clean`, `suspicious` ou `malicious`).
- `moderation` é um snapshot de moderação atual no nível da skill derivado da versão mais recente.
- Ao consultar uma versão histórica, verifique `moderation.matchesRequestedVersion` e `moderation.sourceVersion` antes de tratar `moderation` e `security` como o mesmo contexto de versão.

### `POST /api/v1/skills/-/scan`

Endpoint autenticado de envio para novos jobs do ClawScan.

Scans de upload local não são mais compatíveis. Solicitações usando
`multipart/form-data` ou `{ "source": { "kind": "upload" } }` retornam `410`.

Scans publicados usam JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Observações:

- Payloads de solicitação de scan e relatórios baixáveis expiram do armazenamento de solicitações de scan após a janela de retenção.
- Scans publicados exigem acesso de gerenciamento de proprietário/publicador ou autoridade de moderador/administrador da plataforma.
- Scans publicados gravam de volta somente quando `update: true` e o scan é concluído com sucesso.
- A resposta é `202` com `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Jobs de scan são assíncronos. Solicitações manuais de scan são priorizadas à frente do trabalho normal de publicação/backfill, mas a conclusão ainda depende da disponibilidade dos workers.

### `GET /api/v1/skills/-/scan/{scanId}`

Endpoint autenticado de polling para um scan enviado.

- Retorna status de queued/running/succeeded/failed.
- Retorna `queue.queuedAhead` e `queue.position` enquanto estiver na fila, para que clientes possam mostrar quantos scans manuais priorizados estão à frente da solicitação. Filas muito grandes são limitadas e relatadas com `queuedAheadIsEstimate: true`.
- Quando disponível, `report` contém as seções `clawscan`, `skillspector`, `staticAnalysis` e `virustotal`.
- Jobs de scan com falha retornam `status: "failed"` com `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Endpoint autenticado de arquivo de relatório.

- Exige um scan concluído com sucesso; scans não terminais retornam `409`.
- Retorna um ZIP com `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` e `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Endpoint autenticado de arquivo de relatório armazenado para versões enviadas.

- Exige acesso de gerenciamento de proprietário/publicador à skill ou ao plugin, ou autoridade de moderador/administrador da plataforma.
- Retorna resultados de scan armazenados para a versão exata enviada, incluindo versões bloqueadas ou ocultas.
- `kind` usa `skill` como padrão; use `kind=plugin` para scans de plugin/pacote.
- Retorna o mesmo formato de ZIP que downloads de solicitações de scan.

### `POST /api/v1/skills/-/scan/batch`

Rota canônica de novo scan em lote somente para administradores. Ela aceita o mesmo formato de payload que a rota legada `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Rota canônica de status em lote somente para administradores. Ela aceita `{ "jobIds": ["..."] }` e retorna os mesmos contadores agregados que a rota legada `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Retorna o envelope de verificação do Skill Card usado por `clawhub skill verify`.

Parâmetros de consulta:

- `version` (opcional): string de versão específica.
- `tag` (opcional): resolve uma versão marcada (por exemplo, `latest`).

Observações:

- `ok` é `true` somente quando a versão selecionada tem um Skill Card gerado, não está bloqueada como malware pela moderação e a verificação do ClawScan está limpa.
- A identidade da skill, a identidade do publicador e os metadados da versão selecionada são campos de envelope no nível superior (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) para que automações de shell possam lê-los sem desempacotar wrappers aninhados.
- `security` é o veredito de ClawScan/segurança no nível superior. Automações devem se basear em `ok`, `decision`, `reasons` e `security.status`.
- `security.signals` contém evidências de apoio dos scanners, como `staticScan`, `virusTotal` e `skillSpector`.
- `security.signals.dependencyRegistry` é mantido para compatibilidade da resposta v1, mas o scanner de existência no registro de dependências foi aposentado e esta chave é sempre `null`.
- `provenance` é `server-resolved-github-import` somente quando o ClawHub resolveu e armazenou um repositório/ref/commit/caminho do GitHub durante publicação ou importação; caso contrário, é `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Retorna vereditos de segurança compactos atuais para versões exatas de skills. Este
endpoint de coleção é destinado a clientes que já sabem quais versões de skills
do ClawHub instaladas precisam exibir, como o OpenClaw Control UI.

Solicitação:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Observações:

- `items` deve conter de 1 a 100 pares únicos `{ slug, version }`.
- Os resultados são por item; uma skill ou versão ausente não faz a resposta inteira falhar.
- A resposta é somente de segurança. Ela não inclui dados do Skill Card, status de card gerado, listas de arquivos de artefato nem payloads detalhados dos scanners.
- `security.signals` contém apenas evidências de apoio no nível de status; use `/scan` ou a página de auditoria de segurança do ClawHub para detalhes completos dos scanners.
- `security.signals.dependencyRegistry` é mantido para compatibilidade da resposta v1, mas o scanner de existência no registro de dependências foi aposentado e esta chave é sempre `null`.
- A ausência do Skill Card não afeta `ok`, `decision` ou `reasons` deste endpoint; clientes devem ler o `skill-card.md` instalado localmente quando precisarem do conteúdo do card.
- Use `/verify` quando precisar do envelope de verificação de Skill Card para uma única skill, `/card` quando precisar do markdown do card gerado e `/scan` quando precisar de dados detalhados dos scanners.

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

- O padrão é a versão mais recente.
- Limite de tamanho do arquivo: 200KB.

### `GET /api/v1/packages`

Endpoint de catálogo unificado para:

- skills
- plugins de código
- plugins de bundle

Parâmetros de consulta:

- `limit` (opcional): inteiro (1–100)
- `cursor` (opcional): cursor de paginação
- `family` (opcional): `skill`, `code-plugin` ou `bundle-plugin`
- `channel` (opcional): `official`, `community` ou `private`
- `isOfficial` (opcional): `true` ou `false`
- `sort` (opcional): `updated` (padrão), `recommended`, `trending`, `downloads`, alias legado `installs`
- `category` (opcional): filtro de categoria de plugin. Compatível apenas quando a
  solicitação tem escopo para pacotes de plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` ou endpoints de pacote com
  `family=code-plugin`/`family=bundle-plugin`). Categorias controladas e
  aliases legados de filtro v1 estão documentados em `GET /api/v1/plugins`.

Observações:

- Valores inválidos para `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` ou `sort` retornam `400`. Parâmetros de consulta desconhecidos são ignorados.
- `GET /api/v1/code-plugins` e `GET /api/v1/bundle-plugins` permanecem aliases de família fixa.
- As entradas de Skill continuam apoiadas pelo registro de skills e ainda podem ser publicadas somente por meio de `POST /api/v1/skills`.
- `POST /api/v1/packages` ainda é apenas para releases de code-plugin e bundle-plugin.
- Chamadores anônimos veem apenas canais de pacotes públicos.
- Chamadores autenticados podem ver pacotes privados de publicadores aos quais pertencem nos resultados de listagem/pesquisa.
- `channel=private` retorna apenas pacotes que o chamador autenticado pode ler.

### `GET /api/v1/packages/search`

Pesquisa de catálogo unificado entre skills + pacotes de plugin.

Parâmetros de consulta:

- `q` (obrigatório): string de consulta
- `limit` (opcional): inteiro (1–100)
- `family` (opcional): `skill`, `code-plugin` ou `bundle-plugin`
- `channel` (opcional): `official`, `community` ou `private`
- `isOfficial` (opcional): `true` ou `false`
- `category` (opcional): filtro de categoria de plugin. Compatível apenas quando a
  solicitação tem escopo para pacotes de plugin. Categorias controladas e aliases
  legados de filtro v1 estão documentados em `GET /api/v1/plugins`.

Observações:

- Valores inválidos para `family`, `channel`, `isOfficial`, `featured` ou
  `highlightedOnly` retornam `400`. Parâmetros de consulta desconhecidos são ignorados.
- Chamadores anônimos veem apenas canais de pacotes públicos.
- Chamadores autenticados podem pesquisar pacotes privados de publicadores aos quais pertencem.
- `channel=private` retorna apenas pacotes que o chamador autenticado pode ler.

### `GET /api/v1/plugins`

Navegação no catálogo somente de Plugin entre pacotes code-plugin e bundle-plugin.

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
No endpoint unificado `/api/v1/packages`, é exclusivo para plugins; use
`/api/v1/skills?sort=trending` para o catálogo de skills.

Aliases legados não são aceitos como valores de categoria armazenados ou declarados pelo autor.

### `GET /api/v1/skills/export`

Exportação em lote das skills públicas mais recentes para análise offline.

Autenticação:

- Token de API obrigatório.

Parâmetros de consulta:

- `startDate` (obrigatório): limite inferior em milissegundos Unix para `updatedAt` da skill.
- `endDate` (obrigatório): limite superior em milissegundos Unix para `updatedAt` da skill.
- `limit` (opcional): inteiro (1-250), padrão `250`.
- `cursor` (opcional): cursor de paginação da resposta anterior.

Resposta:

- Corpo: arquivo ZIP.
- Cada skill exportada tem raiz em `{publisher}/{slug}/`.
- Skills hospedadas incluem os arquivos da versão armazenada mais recente e são listadas em
  `_manifest.json` com `sourceRef: "public-clawhub"`.
- Skills atuais com origem no GitHub com uma verificação `clean` ou `suspicious` incluem
  `_source_handoff.json` com `sourceRef: "public-github"`, repositório, commit, caminho,
  hash de conteúdo e URL do arquivo. Elas não incluem arquivos-fonte hospedados no ClawHub.
- Cada skill inclui `_export_skill_meta.json`.
- `_manifest.json` é sempre incluído na raiz do ZIP.
- `_errors.json` é incluído quando skills ou arquivos individuais não puderam ser
  exportados.

Cabeçalhos:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Exportação em massa dos lançamentos públicos mais recentes de Plugin para análise offline.

Autenticação:

- Token de API obrigatório.

Parâmetros de consulta:

- `startDate` (obrigatório): limite inferior em milissegundos Unix para `updatedAt` do Plugin.
- `endDate` (obrigatório): limite superior em milissegundos Unix para `updatedAt` do Plugin.
- `limit` (opcional): inteiro (1-250), padrão `250`.
- `cursor` (opcional): cursor de paginação da resposta anterior.
- `family` (opcional): `code-plugin` ou `bundle-plugin`. Omitido significa ambas
  as famílias de Plugin.

Resposta:

- Corpo: arquivo ZIP.
- Cada Plugin exportado tem raiz em `{family}/{packageName}/`.
- Cada Plugin exportado inclui os arquivos armazenados do lançamento mais recente.
- Os metadados de exportação por Plugin são armazenados em
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` é sempre incluído na raiz do ZIP.
- `_errors.json` é incluído quando Plugins ou arquivos individuais não puderam ser
  exportados.

Cabeçalhos:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Busca somente de Plugin entre pacotes code-plugin e bundle-plugin.

Parâmetros de consulta:

- `q` (obrigatório): string de consulta
- `limit` (opcional): inteiro (1-100)
- `isOfficial` (opcional): `true` ou `false`
- `category` (opcional): filtro de categoria de Plugin. Valores atuais:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Observações:

- Os aliases legados de filtro da v1 documentados em `GET /api/v1/plugins` também são
  aceitos.
- A filtragem por categoria é um filtro real da API, baseado em linhas de resumo
  de categoria de Plugin, não uma reescrita de consulta de busca.
- Os resultados são retornados em ordem de relevância e atualmente não paginam.
- Os controles de ordenação da interface do navegador para busca de Plugin reordenam os resultados de relevância carregados,
  correspondendo ao comportamento atual de navegação de `/skills`.

### `GET /api/v1/packages/{name}`

Retorna metadados detalhados do pacote.

Observações:

- Skills também podem ser resolvidas por esta rota no catálogo unificado.
- Pacotes privados retornam `404`, a menos que o chamador possa ler o editor proprietário.

### `DELETE /api/v1/packages/{name}`

Exclui de forma reversível um pacote e todos os lançamentos.

Observações:

- Requer um token de API do proprietário do pacote, de um proprietário/administrador do editor da organização,
  moderador da plataforma ou administrador da plataforma.

### `GET /api/v1/packages/{name}/versions`

Retorna o histórico de versões.

Parâmetros de consulta:

- `limit` (opcional): inteiro (1–100)
- `cursor` (opcional): cursor de paginação

Observações:

- Pacotes privados retornam `404`, a menos que o chamador possa ler o editor proprietário.

### `GET /api/v1/packages/{name}/versions/{version}`

Retorna uma versão de pacote, incluindo metadados de arquivo, compatibilidade,
verificação, metadados de artefato e dados de varredura.

Observações:

- `version.artifact.kind` é `legacy-zip` para arquivos de pacote do mundo antigo ou
  `npm-pack` para lançamentos baseados em ClawPack.
- Lançamentos ClawPack incluem campos compatíveis com npm `npmIntegrity`, `npmShasum` e
  `npmTarballName`.
- `version.sha256hash` é metadado de compatibilidade obsoleto para clientes antigos. Ele
  gera hash dos bytes ZIP exatos retornados por `/api/v1/packages/{name}/download`.
  Clientes modernos devem usar `version.artifact.sha256`, que identifica o
  artefato canônico do lançamento.
- `version.vtAnalysis`, `version.llmAnalysis` e `version.staticScan` são
  incluídos quando dados de varredura existem.
- Pacotes privados retornam `404`, a menos que o chamador possa ler o editor proprietário.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Retorna o resumo exato de segurança e confiança do lançamento do pacote para clientes de
instalação. Esta é a superfície pública de consumo do OpenClaw para decidir se um
lançamento resolvido pode ser instalado.

Autenticação:

- Endpoint de leitura pública. Nenhum token de proprietário, editor, moderador ou administrador é
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

Campos de resposta:

- `package.name`, `package.displayName` e `package.family` identificam o
  pacote de registro resolvido.
- `release.releaseId`, `release.version` e `release.createdAt` identificam o
  lançamento exato que foi avaliado.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` e `release.npmTarballName` estão presentes quando conhecidos para
  o artefato do lançamento.
- `trust.scanStatus` é o status efetivo de confiança derivado de entradas de varredura
  e moderação manual do lançamento.
- `trust.moderationState` é anulável. Ele é `null` quando não existe moderação manual de
  lançamento.
- `trust.blockedFromDownload` é o sinal de bloqueio de instalação. OpenClaw e outros
  clientes de instalação devem bloquear a instalação quando esse valor for `true`, em vez de
  rederivar regras de bloqueio a partir dos campos de varredura ou moderação.
- `trust.reasons` é a lista de explicações voltada ao usuário e de auditoria. Códigos de motivo
  são strings estáveis e compactas, como `manual:quarantined`, `scan:malicious`
  e `package:malicious`.
- `trust.pending` significa que uma ou mais entradas de confiança ainda aguardam conclusão.
- `trust.stale` significa que o resumo de confiança foi calculado a partir de entradas desatualizadas e
  deve ser tratado como exigindo atualização antes de uma decisão de permissão com alta confiança.

Observações:

- Este endpoint é exato por versão. Clientes devem chamá-lo depois de resolver a
  versão do pacote que pretendem instalar, não apenas depois de ler os metadados
  mais recentes do pacote.
- Pacotes privados retornam `404`, a menos que o chamador possa ler o editor proprietário.
- Este endpoint é intencionalmente mais restrito do que endpoints de moderação de proprietário/moderador.
  Ele expõe a decisão de instalação e a explicação pública, não
  identidades de relatores, corpos de relatórios, evidências privadas ou cronogramas internos de revisão.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Retorna os metadados explícitos do resolvedor de artefato para uma versão de pacote.

Observações:

- Versões legadas de pacote retornam um artefato `legacy-zip` e uma
  `downloadUrl` de ZIP legado.
- Versões ClawPack retornam um artefato `npm-pack`, campos de integridade npm, uma
  `tarballUrl` e a URL de compatibilidade com ZIP legado.
- Esta é a superfície de resolvedor do OpenClaw; ela evita adivinhar o formato do arquivo a partir
  de uma URL compartilhada.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Baixa o artefato da versão pelo caminho explícito do resolvedor.

Observações:

- Versões ClawPack transmitem os bytes exatos do `.tgz` npm-pack enviado.
- Versões ZIP legadas redirecionam para `/api/v1/packages/{name}/download?version=`.
- Usa o bucket de limite de taxa de download.

### `GET /api/v1/packages/{name}/readiness`

Retorna a prontidão calculada para consumo futuro pelo OpenClaw.

Verificações de prontidão cobrem:

- status de canal oficial
- disponibilidade da versão mais recente
- disponibilidade do artefato npm-pack ClawPack
- resumo do artefato
- proveniência do repositório de origem e do commit
- metadados de compatibilidade do OpenClaw
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

Endpoint de moderador para listar linhas de migração de Plugin oficial do OpenClaw.

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

Endpoint de administrador para criar ou atualizar uma linha de migração de Plugin oficial.

Autenticação:

- Requer um token de API de um usuário administrador.

Corpo da solicitação:

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

- `bundledPluginId` é normalizado para minúsculas e é a chave estável de upsert.
- `packageName` é normalizado como nome npm; o pacote pode estar ausente em migrações
  planejadas.
- Isto acompanha apenas a prontidão da migração. Não altera o OpenClaw nem gera
  ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Endpoint de moderador/administrador para filas de revisão de lançamentos de pacote.

Autenticação:

- Requer um token de API de um usuário moderador ou administrador.

Parâmetros de consulta:

- `status` (opcional): `open` (padrão), `blocked`, `manual` ou `all`
- `limit` (opcional): inteiro (1-100)
- `cursor` (opcional): cursor de paginação

Significados dos status:

- `open`: lançamentos suspeitos, maliciosos, pendentes, em quarentena, revogados ou reportados.
- `blocked`: lançamentos em quarentena, revogados ou maliciosos.
- `manual`: qualquer lançamento com uma substituição de moderação manual.
- `all`: qualquer lançamento com uma substituição manual, estado de varredura não limpo ou relatório de pacote.

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

Reporta um pacote para revisão de moderador. Relatórios são no nível do pacote, opcionalmente
vinculados a uma versão. Eles alimentam a fila de moderação, mas não ocultam automaticamente nem
bloqueiam downloads por si só; moderadores devem usar a moderação de lançamento para
aprovar, colocar em quarentena ou revogar artefatos.

Autenticação:

- Requer um token de API.

Solicitação:

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

Endpoint de moderador/admin para recebimento de relatórios de pacote.

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

Endpoint de proprietário/moderador para visibilidade de moderação de pacote.

Autenticação:

- Requer um token de API para o proprietário do pacote, membro publicador, moderador ou
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

Endpoint de moderador/admin para resolver ou reabrir relatórios de pacote.

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
- `quarantined`: bloqueado aguardando acompanhamento.
- `revoked`: bloqueado depois que uma versão foi anteriormente confiável.

Versões em quarentena e revogadas retornam `403` das rotas de download de artefatos.
Toda alteração grava uma entrada no log de auditoria.

### `GET /api/v1/packages/{name}/file`

Retorna o conteúdo de texto bruto de um arquivo de pacote.

Parâmetros de consulta:

- `path` (obrigatório)
- `version` (opcional)
- `tag` (opcional)

Observações:

- Usa a versão mais recente por padrão.
- Usa o bucket de taxa de leitura, não o bucket de download.
- Arquivos binários retornam `415`.
- Limite de tamanho de arquivo: 200 KB.
- Varreduras pendentes do VirusTotal não bloqueiam leituras; versões maliciosas ainda podem ser retidas em outro lugar.
- Pacotes privados retornam `404`, a menos que o chamador possa ler o publicador proprietário.

### `GET /api/v1/packages/{name}/download`

Baixa o arquivo ZIP determinístico legado para uma versão de pacote.

Parâmetros de consulta:

- `version` (opcional)
- `tag` (opcional)

Observações:

- Usa a versão mais recente por padrão.
- Skills redirecionam para `GET /api/v1/download`.
- Arquivos de Plugin/pacote são arquivos zip com uma raiz `package/` para que clientes antigos do OpenClaw
  continuem funcionando.
- Esta rota permanece apenas ZIP. Ela não transmite arquivos ClawPack `.tgz`.
- As respostas incluem os cabeçalhos `ETag`, `Digest`, `X-ClawHub-Artifact-Type` e
  `X-ClawHub-Artifact-Sha256` para verificações de integridade do resolvedor.
- Metadados exclusivos do registro não são injetados no arquivo baixado.
- Varreduras pendentes do VirusTotal não bloqueiam downloads; versões maliciosas retornam `403`.
- Pacotes privados retornam `404`, a menos que o chamador seja o proprietário.

### `GET /api/npm/{package}`

Retorna um packument compatível com npm para versões de pacote baseadas em ClawPack.

Observações:

- Apenas versões com tarballs npm-pack ClawPack enviados são listadas.
- Versões legadas apenas ZIP são omitidas intencionalmente.
- `dist.tarball`, `dist.integrity` e `dist.shasum` usam campos compatíveis com npm
  para que usuários possam apontar npm para o espelho se escolherem.
- Packuments de pacotes com escopo são compatíveis tanto com `/api/npm/@scope/name` quanto com o caminho de solicitação
  codificado do npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Transmite os bytes exatos do tarball ClawPack enviado para clientes de espelho npm.

Observações:

- Usa o bucket de taxa de download.
- Cabeçalhos de download incluem SHA-256 do ClawHub mais metadados de integridade/shasum do npm.
- Verificações de moderação e acesso a pacote privado ainda se aplicam.

### `GET /api/v1/resolve`

Usado pela CLI para mapear uma impressão digital local para uma versão conhecida.

Parâmetros de consulta:

- `slug` (obrigatório)
- `hash` (obrigatório): sha256 hexadecimal de 64 caracteres da impressão digital do bundle

Resposta:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Baixa um ZIP de versão de skill hospedada ou retorna uma transferência de origem do GitHub para uma
skill atual baseada no GitHub com varredura `clean` ou `suspicious` e nenhuma versão
hospedada.

Parâmetros de consulta:

- `slug` (obrigatório)
- `version` (opcional): string semver
- `tag` (opcional): nome da tag (por exemplo, `latest`)

Observações:

- Se nem `version` nem `tag` forem fornecidos, a versão mais recente será usada.
- Versões excluídas de forma reversível retornam `410`.
- Transferências de skill baseadas no GitHub não fazem proxy nem espelham bytes. A resposta JSON
  inclui `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  e `archiveUrl`; o estado de varredura/atual é uma barreira e não é incluído como metadado de carga útil
  de sucesso.
- Estatísticas de download são contadas como identidades únicas por dia UTC (`userId` quando o token de API é válido, caso contrário IP).

## Endpoints de autenticação (token Bearer)

Todos os endpoints exigem:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Valida o token e retorna o identificador do usuário.

### `POST /api/v1/skills`

Publica uma nova versão.

- Preferencial: `multipart/form-data` com JSON `payload` + blobs `files[]`.
- Corpo JSON com `files` (baseados em storageId) também é aceito.
- Campo opcional de payload: `ownerHandle`. Quando presente, a API resolve esse
  publicador no servidor e exige que o ator tenha acesso ao publicador.
- Campo opcional de payload: `migrateOwner`. Quando `true` com `ownerHandle`, uma
  skill existente pode ser movida para esse proprietário se o ator for admin/proprietário tanto no
  publicador atual quanto no de destino. Sem esta adesão explícita, alterações de proprietário são
  rejeitadas.

### `POST /api/v1/packages`

Publica uma versão de code-plugin ou bundle-plugin.

- Requer autenticação por token Bearer.
- Requer `multipart/form-data`.
- Os campos de formulário permitidos são `payload`, blobs repetidos `files` ou uma referência de tarball
  `clawpack`. `clawpack` pode ser um blob `.tgz` ou um id de armazenamento retornado pelo
  fluxo de upload-url. Publicações por storage-id preparado também devem incluir o
  `clawpackUploadTicket` retornado com essa URL de upload.
- Use `files` ou `clawpack`, nunca ambos na mesma solicitação.
- Corpos JSON e metadados `payload.files` / `payload.artifact` fornecidos pelo chamador
  são rejeitados.
- Solicitações diretas de publicação multipart são limitadas a 18 MB. Tarballs ClawPack podem
  usar o fluxo de upload-url até o limite de tarball de 120 MB.
- Campo opcional de payload: `ownerHandle`. Quando presente, apenas admins podem publicar em nome desse proprietário.

Destaques de validação:

- `family` deve ser `code-plugin` ou `bundle-plugin`.
- Pacotes de Plugin exigem `openclaw.plugin.json`. Uploads ClawPack `.tgz` devem
  contê-lo em `package/openclaw.plugin.json`.
- Code plugins exigem `package.json`, metadados de repositório de origem, metadados de commit de origem,
  metadados de esquema de configuração, `openclaw.compat.pluginApi` e
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` e `openclaw.environment` são metadados opcionais.
- Apenas o publicador da organização `openclaw` e os publicadores pessoais dos membros atuais da organização `openclaw`
  podem publicar no canal `official`.
- Publicações em nome de terceiros ainda validam a elegibilidade ao canal oficial em relação à conta do proprietário de destino.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Exclui de forma reversível / restaura uma skill (proprietário, moderador ou admin).

Corpo JSON opcional:

```json
{ "reason": "Held for moderation pending legal review." }
```

Quando presente, `reason` é armazenado como a nota de moderação da skill e copiado para o log de auditoria.
Exclusões reversíveis iniciadas pelo proprietário reservam o slug por 30 dias; depois disso, o slug pode ser reivindicado por
outro publicador. A resposta de exclusão inclui `slugReservedUntil` quando esse prazo se aplica.
Ocultações por moderador/admin e remoções de segurança não expiram dessa forma.

Resposta de exclusão:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Códigos de status:

- `200`: ok
- `401`: não autorizado
- `403`: proibido
- `404`: skill/usuário não encontrado
- `500`: erro interno do servidor

### `POST /api/v1/users/publisher`

Somente admin. Garante que exista um publicador de organização para um identificador. Se o identificador ainda apontar para um
usuário/publicador pessoal compartilhado legado, o endpoint o migra primeiro para um publicador de organização.
Para uma organização recém-criada, forneça `memberHandle`; o admin atuante não é adicionado como membro.
`memberRole` usa `owner` por padrão.

- Corpo: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Resposta: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Criação autenticada de publicador de organização por autosserviço. Cria um novo publicador de organização e adiciona o
chamador como proprietário. Este endpoint não migra identificadores de usuário/pessoais existentes e
não marca o publicador como confiável/oficial.

- Corpo: `{ "handle": "opik", "displayName": "Opik" }`
- Resposta: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Retorna `409` quando o identificador já é usado por um publicador, usuário ou publicador pessoal.

### `POST /api/v1/users/reserve`

Somente admin. Reserva slugs raiz e nomes de pacote para um proprietário legítimo sem publicar uma
versão. Nomes de pacote se tornam pacotes de placeholder privados sem linhas de versão, para que o mesmo
proprietário possa publicar depois a versão real de code-plugin ou bundle-plugin nesse nome.

- Corpo: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Resposta: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Somente admin. Recupera um publicador pessoal para um principal substituto verificado do GitHub OAuth
sem editar linhas de conta do Convex Auth. A solicitação deve nomear ambos os ids de conta de provedor GitHub
imutáveis; identificadores mutáveis são usados apenas como uma proteção voltada ao operador.

O endpoint usa simulação por padrão. Aplicar a recuperação exige `dryRun: false` e
`confirmIdentityVerified: true` depois que a equipe verificar independentemente a continuidade entre ambos os
principais do GitHub. A recuperação falha de forma fechada quando o publicador pessoal atual do usuário de destino
tem habilidades, pacotes ou fontes de habilidade do GitHub.
A recuperação também migra campos legados `ownerUserId` para as habilidades do publicador recuperado,
aliases de slug de habilidade, pacotes, avisos do inspetor de pacotes e linhas derivadas de resumo de busca, para que
os caminhos de proprietário direto concordem com a nova autoridade do publicador. Uma reserva ativa de identificador
protegido para o identificador recuperado também é reatribuída ao usuário substituto, para que a sincronização
posterior do perfil não possa restaurar a autoridade concorrente do usuário anterior. Cada tabela primária é limitada a
100 linhas por transação de aplicação; recuperações maiores devem primeiro usar uma migração de proprietário retomável.
Fontes de habilidade do GitHub têm escopo por publicador e são relatadas como verificadas, em vez de reescritas.

- Corpo: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Resposta: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Endpoints de gerenciamento de slug do proprietário

- `POST /api/v1/skills/{slug}/rename`
  - Corpo: `{ "newSlug": "new-canonical-slug" }`
  - Resposta: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Corpo: `{ "targetSlug": "canonical-target-slug" }`
  - Resposta: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Observações:

- Ambos os endpoints exigem autenticação por token de API e funcionam apenas para o proprietário da habilidade.
- `rename` preserva o slug anterior como um alias de redirecionamento.
- `merge` oculta a listagem de origem e redireciona o slug de origem para a listagem de destino.

### Endpoints de transferência de propriedade

- `POST /api/v1/skills/{slug}/transfer`
  - Corpo: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Resposta: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Resposta (aceitar/rejeitar/cancelar): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Formato da resposta: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Bane um usuário e exclui permanentemente as habilidades de sua propriedade (somente moderador/admin).

Corpo:

```json
{ "handle": "user_handle", "reason": "optional ban reason" }
```

ou

```json
{ "userId": "users_...", "reason": "optional ban reason" }
```

Resposta:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

Remove o banimento de um usuário e restaura habilidades elegíveis (somente admin).

Corpo:

```json
{ "handle": "user_handle", "reason": "optional unban reason" }
```

ou

```json
{ "userId": "users_...", "reason": "optional unban reason" }
```

Resposta:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

Altera o motivo armazenado para um banimento existente sem remover o banimento nem restaurar
conteúdo (somente admin). Usa simulação por padrão, a menos que `dryRun` seja `false`.

Corpo:

```json
{ "handle": "user_handle", "reason": "bulk publishing spam", "dryRun": true }
```

ou

```json
{ "userId": "users_...", "reason": "bulk publishing spam", "dryRun": false }
```

Resposta:

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "malware auto-ban",
  "nextReason": "bulk publishing spam",
  "changed": true
}
```

### `POST /api/v1/users/role`

Altera a função de um usuário (somente admin).

Corpo:

```json
{ "handle": "user_handle", "role": "moderator" }
```

ou

```json
{ "userId": "users_...", "role": "admin" }
```

Resposta:

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

Lista ou busca usuários (somente admin).

Parâmetros de consulta:

- `q` (opcional): consulta de busca
- `query` (opcional): alias para `q`
- `limit` (opcional): máximo de resultados (padrão 20, máximo 200)

Resposta:

```json
{
  "items": [
    {
      "userId": "users_...",
      "handle": "user_handle",
      "displayName": "User",
      "name": "User",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

Adiciona/remove uma estrela (destaques). Ambos os endpoints são idempotentes.

Respostas:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Endpoints legados da CLI (obsoletos)

Ainda há suporte para versões mais antigas da CLI:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Consulte `DEPRECATIONS.md` para o plano de remoção.

`POST /api/cli/upload-url` retorna `uploadUrl` e `uploadTicket`. Publicações de pacote
que preparam um tarball ClawPack devem enviar o ID de armazenamento resultante como
`clawpack` e o ticket retornado como `clawpackUploadTicket`.

## Descoberta de registro (`/.well-known/clawhub.json`)

A CLI pode descobrir configurações de registro/autenticação a partir do site:

- `/.well-known/clawhub.json` (JSON, preferido)
- `/.well-known/clawdhub.json` (legado)

Esquema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Se você hospedar por conta própria, sirva este arquivo (ou defina `CLAWHUB_REGISTRY` explicitamente; legado `CLAWDHUB_REGISTRY`).
