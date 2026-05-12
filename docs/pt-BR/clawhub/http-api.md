---
read_when:
    - Adicionando/alterando endpoints
    - Depuração de requisições CLI ↔ registro
summary: Referência da API HTTP (endpoints públicos + endpoints da CLI + autenticação).
x-i18n:
    generated_at: "2026-05-12T04:09:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c217e56a38d697d8cc6e1c7f0c6481fd762ecbadcf5629964c1f49781d5405b
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

URL base: `https://clawhub.ai` (padrão).

Todos os caminhos v1 ficam em `/api/v1/...`.
Os caminhos legados `/api/...` e `/api/cli/...` permanecem para compatibilidade (consulte `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Reutilização do catálogo público

Diretórios de terceiros podem usar os endpoints públicos de leitura para listar ou pesquisar Skills do ClawHub. Armazene os resultados em cache, respeite `429`/`Retry-After`, encaminhe os usuários de volta para a listagem canônica do ClawHub (`https://clawhub.ai/<owner>/<slug>`) e evite sugerir endosso do ClawHub ao site de terceiros. Não tente espelhar conteúdo oculto, privado ou bloqueado por moderação fora da superfície pública da API.

Atalhos de slug da Web são resolvidos entre famílias de registro, mas clientes da API devem usar
as URLs canônicas retornadas pelos endpoints de leitura em vez de reconstruir a precedência
de rotas.

## Limites de taxa

Modelo de aplicação:

- Solicitações anônimas: aplicadas por IP.
- Solicitações autenticadas (token Bearer válido): aplicadas por bucket de usuário.
- Se o token estiver ausente/inválido, o comportamento volta para a aplicação por IP.
- Endpoints autenticados de escrita não devem retornar um `Unauthorized` simples quando
  o servidor sabe o motivo. Tokens ausentes, tokens inválidos/revogados e
  contas excluídas/banidas/desativadas devem receber texto acionável para que clientes
  CLI possam informar aos usuários o que os bloqueou.

- Leitura: 600/min por IP, 2400/min por chave
- Escrita: 45/min por IP, 180/min por chave
- Download: 30/min por IP, 180/min por chave (`/api/v1/download`)

Cabeçalhos:

- Compatibilidade legada: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Padronizados: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- Em `429`: `Retry-After`

Semântica dos cabeçalhos:

- `X-RateLimit-Reset`: segundos absolutos desde a época Unix
- `RateLimit-Reset`: segundos até o reset (atraso)
- `Retry-After`: segundos a esperar antes de tentar novamente (atraso) em `429`

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

- Se `Retry-After` existir, espere esse número de segundos antes de tentar novamente.
- Use backoff com jitter para evitar novas tentativas sincronizadas.
- Se `Retry-After` estiver ausente, use `RateLimit-Reset` como fallback (ou calcule a partir de `X-RateLimit-Reset`).

Origem do IP:

- Usa `cf-connecting-ip` (Cloudflare) para o IP do cliente por padrão.
- O ClawHub usa cabeçalhos de encaminhamento confiáveis para identificar IPs de clientes na borda.
- Se nenhum IP de cliente confiável estiver disponível, solicitações anônimas de download usam um bucket de fallback com escopo do endpoint em vez de um bucket global `ip:unknown`. Solicitações anônimas de leitura/escrita ainda usam o bucket desconhecido compartilhado para que o roteamento sem IP permaneça visível e conservador.

## Endpoints públicos (sem autenticação)

### `GET /api/v1/search`

Parâmetros de consulta:

- `q` (obrigatório): string de consulta
- `limit` (opcional): inteiro
- `highlightedOnly` (opcional): `true` para filtrar para Skills em destaque
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
      "updatedAt": 1730000000000
    }
  ]
}
```

Observações:

- Os resultados são retornados em ordem de relevância (similaridade de embeddings + reforços de token exato de slug/nome + prior de popularidade a partir de downloads).
- A relevância é mais forte que a popularidade. Uma correspondência precisa de slug ou token de nome de exibição pode superar uma correspondência mais ampla com muito mais downloads.
- Texto ASCII é tokenizado em limites de palavras e pontuação. Por exemplo, `personal-map` contém um token autônomo `map`, enquanto `amap-jsapi-skill` contém `amap`, `jsapi` e `skill`; portanto, pesquisar por `map` dá a `personal-map` uma correspondência lexical mais forte do que `amap-jsapi-skill`.
- Downloads são usados como um prior pequeno em escala logarítmica e critério de desempate, não como o sinal principal de ranqueamento. Skills com muitos downloads podem ranquear mais baixo quando o texto da consulta tem uma correspondência mais fraca.
- Estado de moderação suspeito ou oculto pode remover uma Skill da pesquisa pública dependendo dos filtros do chamador e do status atual de moderação.

Orientação de descoberta para publicadores:

- Coloque os termos que os usuários literalmente pesquisarão no nome de exibição, no resumo e nas tags. Use um token de slug autônomo somente quando ele também for uma identidade estável que você queira manter.
- Não renomeie um slug apenas para perseguir uma consulta, a menos que o novo slug seja um nome canônico melhor no longo prazo. Slugs antigos se tornam aliases de redirecionamento, mas a URL canônica, o slug exibido e os futuros resumos de pesquisa usam o novo slug.
- Aliases de renomeação preservam a resolução para URLs antigas e instalações que resolvem pelo registro, mas o ranqueamento de pesquisa é baseado nos metadados canônicos da Skill depois que a renomeação foi indexada. Estatísticas existentes permanecem com a Skill.
- Se uma Skill estiver inesperadamente invisível, verifique primeiro o estado de moderação com `clawhub inspect <slug>` enquanto estiver conectado antes de alterar metadados relacionados a ranqueamento.

### `GET /api/v1/skills`

Parâmetros de consulta:

- `limit` (opcional): inteiro (1–200)
- `cursor` (opcional): cursor de paginação para qualquer ordenação que não seja `trending`
- `sort` (opcional): `updated` (padrão), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), `installsCurrent` (alias: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (opcional): `true` para ocultar Skills suspeitas (`flagged.suspicious`)
- `nonSuspicious` (opcional): alias legado para `nonSuspiciousOnly`

Observações:

- `trending` ranqueia por instalações nos últimos 7 dias (com base em telemetria).
- `createdAt` é estável para rastreamentos de novas Skills; `updated` muda quando Skills existentes são republicadas.
- Quando `nonSuspiciousOnly=true`, ordenações baseadas em cursor podem retornar menos de `limit` itens em uma página porque Skills suspeitas são filtradas após a recuperação da página.
- Use `nextCursor` para continuar a paginação quando presente. Uma página curta não significa, por si só, fim dos resultados.

Resposta:

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
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
- `moderation` é incluído apenas quando a Skill está sinalizada ou o proprietário a está visualizando.

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
- Chamadores públicos recebem `200` apenas para Skills visíveis já sinalizadas.
- Evidências são redigidas para chamadores públicos e incluem trechos brutos apenas para proprietários/moderadores.

### `POST /api/v1/skills/{slug}/report`

Denuncia uma Skill para análise de moderador. As denúncias são em nível de Skill, opcionalmente vinculadas
a uma versão, e alimentam a fila de denúncias de Skill.

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

Endpoint de moderador/administrador para entrada de denúncias de Skill.

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

Endpoint de moderador/administrador para resolver ou reabrir denúncias de Skill.

Solicitação:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` é obrigatório para `confirmed` e `dismissed`; pode ser omitido ao
definir `status` de volta para `open`. Passe `finalAction: "hide"` com uma denúncia triada
para ocultar a Skill no mesmo fluxo de trabalho auditável.

### `GET /api/v1/skills/{slug}/versions`

Parâmetros de consulta:

- `limit` (opcional): inteiro
- `cursor` (opcional): cursor de paginação

### `GET /api/v1/skills/{slug}/versions/{version}`

Retorna metadados da versão + lista de arquivos.

- `version.security` inclui status normalizado de verificação de varredura e detalhes do scanner
  (VirusTotal + LLM), quando disponível.

### `GET /api/v1/skills/{slug}/scan`

Retorna detalhes de verificação de varredura de segurança para uma versão de Skill.

Parâmetros de consulta:

- `version` (opcional): string de versão específica.
- `tag` (opcional): resolve uma versão marcada (por exemplo, `latest`).

Observações:

- Se nem `version` nem `tag` forem fornecidos, usa a versão mais recente.
- Inclui status de verificação normalizado mais detalhes específicos do scanner.
- `security.capabilityTags` inclui rótulos determinísticos de capacidade/risco como
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token` e `posts-externally` quando detectados.
- `security.hasScanResult` é `true` somente quando um scanner produziu um veredito definitivo (`clean`, `suspicious` ou `malicious`).
- `moderation` é um snapshot atual de moderação em nível de Skill derivado da versão mais recente.
- Ao consultar uma versão histórica, verifique `moderation.matchesRequestedVersion` e `moderation.sourceVersion` antes de tratar `moderation` e `security` como o mesmo contexto de versão.

### `GET /api/v1/skills/{slug}/file`

Retorna conteúdo de texto bruto.

Parâmetros de consulta:

- `path` (obrigatório)
- `version` (opcional)
- `tag` (opcional)

Observações:

- O padrão é a versão mais recente.
- Limite de tamanho de arquivo: 200KB.

### `GET /api/v1/packages`

Endpoint de catálogo unificado para:

- Skills
- Plugins de código
- Plugins de pacote

Parâmetros de consulta:

- `limit` (opcional): inteiro (1–100)
- `cursor` (opcional): cursor de paginação
- `family` (opcional): `skill`, `code-plugin` ou `bundle-plugin`
- `channel` (opcional): `official`, `community` ou `private`
- `isOfficial` (opcional): `true` ou `false`
- `executesCode` (opcional): `true` ou `false`
- `capabilityTag` (opcional): filtro de capacidade para pacotes de Plugin
- `target` / `hostTarget` (opcional): atalho para `host:<target>`
- `os`, `arch`, `libc` (opcional): atalho para filtros de capacidade do host
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (opcional): atalho `true`/`1` para tags de requisito de ambiente
- `externalService`, `binary`, `osPermission` (opcional): atalho para tags nomeadas
  de requisito de ambiente
- `artifactKind` (opcional): `legacy-zip` ou `npm-pack`
- `npmMirror` (opcional): `true`/`1` para mostrar versões de pacote baseadas em ClawPack
  disponíveis por meio do espelho npm

Observações:

- `GET /api/v1/code-plugins` e `GET /api/v1/bundle-plugins` permanecem aliases de família fixa.
- Entradas de Skill continuam baseadas no registro de Skills e ainda podem ser publicadas apenas por meio de `POST /api/v1/skills`.
- `POST /api/v1/packages` ainda é apenas para versões de code-plugin e bundle-plugin.
- Chamadores anônimos veem apenas canais públicos de pacotes.
- Chamadores autenticados podem ver pacotes privados de publicadores aos quais pertencem nos resultados de listagem/pesquisa.
- `channel=private` retorna apenas pacotes que o chamador autenticado pode ler.

### `GET /api/v1/packages/search`

Pesquisa unificada no catálogo entre Skills + pacotes de Plugin.

Parâmetros de consulta:

- `q` (obrigatório): string de consulta
- `limit` (opcional): inteiro (1–100)
- `family` (opcional): `skill`, `code-plugin` ou `bundle-plugin`
- `channel` (opcional): `official`, `community` ou `private`
- `isOfficial` (opcional): `true` ou `false`
- `executesCode` (opcional): `true` ou `false`
- `capabilityTag` (opcional): filtro de capacidade para pacotes de Plugin
- `target` / `hostTarget`, `os`, `arch`, `libc`, `requiresBrowser`,
  `requiresDesktop`, `requiresNativeDeps`, `requiresExternalService`,
  `requiresBinary`, `requiresOsPermission`, `externalService`, `binary` e
  `osPermission` são aceitos como atalhos para tags comuns de capacidade
- `artifactKind` (opcional): `legacy-zip` ou `npm-pack`
- `npmMirror` (opcional): `true`/`1` para pesquisar versões de pacote baseadas em ClawPack
  disponíveis por meio do espelho npm

Observações:

- Chamadores anônimos veem apenas canais públicos de pacotes.
- Chamadores autenticados podem pesquisar pacotes privados de publicadores aos quais pertencem.
- `channel=private` retorna apenas pacotes que o chamador autenticado pode ler.
- Filtros de artefato são baseados em tags de capacidade indexadas:
  `artifact:legacy-zip`, `artifact:npm-pack` e `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

Retorna metadados detalhados do pacote.

Observações:

- Skills também podem ser resolvidas por essa rota no catálogo unificado.
- Pacotes privados retornam `404`, a menos que o chamador possa ler o publicador proprietário.

### `DELETE /api/v1/packages/{name}`

Exclui logicamente um pacote e todas as versões.

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
capacidades, verificação, metadados de artefato e dados de varredura.

Observações:

- `version.artifact.kind` é `legacy-zip` para arquivos de pacote do mundo antigo ou
  `npm-pack` para versões baseadas em ClawPack.
- Versões ClawPack incluem campos compatíveis com npm `npmIntegrity`, `npmShasum` e
  `npmTarballName`.
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis` e `version.staticScan` são incluídos quando existem dados de varredura.
- Pacotes privados retornam `404`, a menos que o chamador possa ler o publicador proprietário.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Retorna os metadados explícitos do resolvedor de artefato para uma versão de pacote.

Observações:

- Versões de pacote legadas retornam um artefato `legacy-zip` e uma URL ZIP legada
  `downloadUrl`.
- Versões ClawPack retornam um artefato `npm-pack`, campos de integridade npm, uma
  `tarballUrl` e a URL de compatibilidade ZIP legada.
- Esta é a superfície do resolvedor do OpenClaw; ela evita adivinhar o formato do arquivo a partir
  de uma URL compartilhada.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Baixa o artefato da versão pelo caminho explícito do resolvedor.

Observações:

- Versões ClawPack transmitem os bytes exatos do `.tgz` npm-pack enviado.
- Versões ZIP legadas redirecionam para `/api/v1/packages/{name}/download?version=`.
- Usa o bucket de taxa de download.

### `GET /api/v1/packages/{name}/readiness`

Retorna a prontidão computada para consumo futuro do OpenClaw.

As verificações de prontidão cobrem:

- status do canal oficial
- disponibilidade da versão mais recente
- disponibilidade do artefato npm-pack do ClawPack
- resumo do artefato
- proveniência do repositório de origem e do commit
- metadados de compatibilidade do OpenClaw
- targets de host
- estado da varredura

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

Endpoint de moderador para listar linhas de migração de Plugins oficiais do OpenClaw.

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
- `packageName` é normalizado como nome npm; o pacote pode estar ausente para migrações
  planejadas.
- Isso rastreia apenas a prontidão da migração. Não altera o OpenClaw nem gera
  ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Endpoint de moderador/administrador para filas de revisão de versões de pacotes.

Autenticação:

- Requer um token de API de um usuário moderador ou administrador.

Parâmetros de consulta:

- `status` (opcional): `open` (padrão), `blocked`, `manual` ou `all`
- `limit` (opcional): inteiro (1-100)
- `cursor` (opcional): cursor de paginação

Significados dos status:

- `open`: versões suspeitas, maliciosas, pendentes, em quarentena, revogadas ou reportadas.
- `blocked`: versões em quarentena, revogadas ou maliciosas.
- `manual`: qualquer versão com uma substituição manual de moderação.
- `all`: qualquer versão com uma substituição manual, estado de varredura não limpo ou relatório de pacote.

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

Reporta um pacote para revisão por moderador. Relatórios são em nível de pacote, opcionalmente
vinculados a uma versão. Eles alimentam a fila de moderação, mas não ocultam automaticamente nem
bloqueiam downloads por conta própria; moderadores devem usar a moderação de versões para
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

Endpoint de moderador/administrador para recebimento de relatórios de pacotes.

Autenticação:

- Requer um token de API de um usuário moderador ou administrador.

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

- Requer um token de API do proprietário do pacote, membro do publicador, moderador ou
  usuário administrador.

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

Endpoint de moderador/administrador para resolver ou reabrir relatórios de pacotes.

Solicitação:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` é obrigatório para `confirmed` e `dismissed`; ele pode ser omitido ao
definir `status` de volta para `open`. Passe `finalAction: "quarantine"` ou
`finalAction: "revoke"` com um relatório confirmado para aplicar a moderação de release no
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

Endpoint de moderador/administrador para análise de release de pacote.

Requisição:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Estados compatíveis:

- `approved`: analisado manualmente e permitido.
- `quarantined`: bloqueado aguardando acompanhamento.
- `revoked`: bloqueado depois que uma release foi considerada confiável anteriormente.

Releases em quarentena e revogadas retornam `403` das rotas de download de artefatos.
Toda alteração grava uma entrada no log de auditoria.

### `POST /api/v1/packages/backfill/artifacts`

Endpoint de manutenção exclusivo para administradores para rotular releases de pacotes antigas com
metadados explícitos de tipo de artefato.

Corpo da requisição:

```json
{
  "cursor": null,
  "batchSize": 100,
  "dryRun": true
}
```

Resposta:

```json
{
  "ok": true,
  "scanned": 100,
  "updated": 12,
  "nextCursor": "cursor...",
  "done": false,
  "dryRun": true
}
```

Observações:

- O padrão é execução simulada.
- Releases sem armazenamento ClawPack são rotuladas como `legacy-zip`.
- Linhas existentes baseadas em ClawPack sem `artifactKind` são reparadas como
  `npm-pack`.
- Isso não gera ClawPacks nem altera bytes de artefatos.

### `GET /api/v1/packages/{name}/file`

Retorna conteúdo de texto bruto para um arquivo de pacote.

Parâmetros de consulta:

- `path` (obrigatório)
- `version` (opcional)
- `tag` (opcional)

Observações:

- O padrão é a release mais recente.
- Usa o bucket de taxa de leitura, não o bucket de download.
- Arquivos binários retornam `415`.
- Limite de tamanho de arquivo: 200 KB.
- Varreduras pendentes do VirusTotal não bloqueiam leituras; releases maliciosas ainda podem ser retidas em outro lugar.
- Pacotes privados retornam `404`, a menos que o chamador possa ler o publicador proprietário.

### `GET /api/v1/packages/{name}/download`

Baixa o arquivo ZIP determinístico legado para uma release de pacote.

Parâmetros de consulta:

- `version` (opcional)
- `tag` (opcional)

Observações:

- O padrão é a release mais recente.
- Skills redirecionam para `GET /api/v1/download`.
- Arquivos de Plugin/pacote são arquivos zip com uma raiz `package/` para que clientes OpenClaw
  antigos continuem funcionando.
- Esta rota permanece exclusiva para ZIP. Ela não transmite arquivos ClawPack `.tgz`.
- As respostas incluem cabeçalhos `ETag`, `Digest`, `X-ClawHub-Artifact-Type` e
  `X-ClawHub-Artifact-Sha256` para verificações de integridade do resolvedor.
- Metadados exclusivos do registro não são injetados no arquivo baixado.
- Varreduras pendentes do VirusTotal não bloqueiam downloads; releases maliciosas retornam `403`.
- Pacotes privados retornam `404`, a menos que o chamador seja o proprietário.

### `GET /api/npm/{package}`

Retorna um packument compatível com npm para versões de pacote baseadas em ClawPack.

Observações:

- Apenas versões com tarballs npm-pack ClawPack enviados são listadas.
- Versões legadas somente ZIP são omitidas intencionalmente.
- `dist.tarball`, `dist.integrity` e `dist.shasum` usam campos compatíveis com npm
  para que usuários possam apontar o npm para o espelho se escolherem.
- Packuments de pacotes com escopo são compatíveis tanto com `/api/npm/@scope/name` quanto com o caminho de requisição
  codificado do npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Transmite os bytes exatos do tarball ClawPack enviado para clientes de espelho npm.

Observações:

- Usa o bucket de taxa de download.
- Cabeçalhos de download incluem SHA-256 do ClawHub mais metadados de integridade/shasum do npm.
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

Baixa um zip de uma versão de skill.

Parâmetros de consulta:

- `slug` (obrigatório)
- `version` (opcional): string semver
- `tag` (opcional): nome da tag (por exemplo, `latest`)

Observações:

- Se nem `version` nem `tag` forem fornecidos, a versão mais recente será usada.
- Versões excluídas de forma reversível retornam `410`.
- Estatísticas de download são contadas como identidades únicas por hora (`userId` quando o token de API é válido; caso contrário, IP).

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
- Corpo JSON com `files` (baseado em storageId) também é aceito.
- Campo opcional de payload: `ownerHandle`. Quando presente, a API resolve esse
  publicador no servidor e exige que o ator tenha acesso ao publicador.
- Campo opcional de payload: `migrateOwner`. Quando `true` com `ownerHandle`, uma
  skill existente pode ser movida para esse proprietário se o ator for administrador/proprietário em ambos
  os publicadores atual e de destino. Sem essa aceitação explícita, alterações de proprietário são
  rejeitadas.

### `POST /api/v1/packages`

Publica uma release de code-plugin ou bundle-plugin.

- Exige autenticação por token Bearer.
- Preferencial: `multipart/form-data` com JSON `payload` + blobs `files[]`.
- Corpo JSON com `files` (baseado em storageId) também é aceito.
- Campo opcional de payload: `ownerHandle`. Quando presente, somente administradores podem publicar em nome desse proprietário.

Destaques de validação:

- `family` deve ser `code-plugin` ou `bundle-plugin`.
- Pacotes de Plugin exigem `openclaw.plugin.json`. Envios ClawPack `.tgz` devem
  contê-lo em `package/openclaw.plugin.json`.
- Plugins de código exigem `package.json`, metadados de repositório de origem, metadados de commit de origem,
  metadados de esquema de configuração, `openclaw.compat.pluginApi` e
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` e `openclaw.environment` são metadados opcionais.
- Somente publicadores confiáveis podem publicar no canal `official`.
- Publicações em nome de terceiros ainda validam a elegibilidade do canal oficial em relação à conta do proprietário de destino.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Exclui de forma reversível / restaura uma skill (proprietário, moderador ou administrador).

Corpo JSON opcional:

```json
{ "reason": "Held for moderation pending legal review." }
```

Quando presente, `reason` é armazenado como a nota de moderação da skill e copiado para o log de auditoria.
Exclusões reversíveis iniciadas pelo proprietário reservam o slug por 30 dias; depois disso, o slug pode ser reivindicado por
outro publicador. A resposta de exclusão inclui `slugReservedUntil` quando essa expiração se aplica.
Ocultações por moderador/administrador e remoções de segurança não expiram dessa forma.

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

Exclusivo para administradores. Garante que exista um publicador de organização para um identificador. Se o identificador ainda apontar para um
publicador legado compartilhado de usuário/pessoal, o endpoint o migrará primeiro para um publicador de organização.

- Corpo: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Resposta: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Exclusivo para administradores. Reserva slugs raiz e nomes de pacotes para um proprietário legítimo sem publicar uma
release. Nomes de pacotes tornam-se pacotes privados de espaço reservado sem linhas de release, para que o mesmo
proprietário possa publicar posteriormente a release real de code-plugin ou bundle-plugin nesse nome.

- Corpo: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Resposta: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### Endpoints de gerenciamento de slug pelo proprietário

- `POST /api/v1/skills/{slug}/rename`
  - Corpo: `{ "newSlug": "new-canonical-slug" }`
  - Resposta: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Corpo: `{ "targetSlug": "canonical-target-slug" }`
  - Resposta: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Observações:

- Ambos os endpoints exigem autenticação por token de API e funcionam apenas para o proprietário da skill.
- `rename` preserva o slug anterior como um alias de redirecionamento.
- `merge` oculta a listagem de origem e redireciona o slug de origem para a listagem de destino.

### Endpoints de transferência de propriedade

- `POST /api/v1/skills/{slug}/transfer`
  - Corpo: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Resposta: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Resposta (accept/reject/cancel): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Formato da resposta: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Bane um usuário e exclui permanentemente skills pertencentes a ele (somente moderador/administrador).

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

Remove o banimento de um usuário e restaura skills elegíveis (somente administrador).

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

### `POST /api/v1/users/role`

Altera a função de um usuário (somente administrador).

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

Lista ou pesquisa usuários (somente administrador).

Parâmetros de consulta:

- `q` (opcional): consulta de pesquisa
- `query` (opcional): alias para `q`
- `limit` (opcional): resultados máximos (padrão 20, máximo 200)

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

Ainda compatíveis com versões antigas da CLI:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Consulte `DEPRECATIONS.md` para o plano de remoção.

## Descoberta de registro (`/.well-known/clawhub.json`)

A CLI pode descobrir configurações de registro/autenticação a partir do site:

- `/.well-known/clawhub.json` (JSON, preferencial)
- `/.well-known/clawdhub.json` (legado)

Esquema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Se você hospedar por conta própria, sirva este arquivo (ou defina `CLAWHUB_REGISTRY` explicitamente; legado `CLAWDHUB_REGISTRY`).
