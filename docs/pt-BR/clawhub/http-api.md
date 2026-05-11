---
read_when:
    - Adicionar/alterar pontos de extremidade
    - Depuração de requisições CLI ↔ registro
summary: Referência da API HTTP (endpoints públicos + CLI + autenticação).
x-i18n:
    generated_at: "2026-05-11T20:23:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1580df58fe2342858dd2c86ebaf659993157b11508c0fc03530e541bd0118ae
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

URL base: `https://clawhub.ai` (padrão).

Todos os caminhos v1 ficam em `/api/v1/...`.
Os caminhos legados `/api/...` e `/api/cli/...` permanecem por compatibilidade (consulte `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Reuso do catálogo público

Diretórios de terceiros podem usar os endpoints públicos de leitura para listar ou pesquisar skills do ClawHub. Armazene os resultados em cache, respeite `429`/`Retry-After`, direcione os usuários de volta para a listagem canônica do ClawHub (`https://clawhub.ai/<owner>/<slug>`) e evite sugerir endosso do ClawHub ao site de terceiros. Não tente espelhar conteúdo oculto, privado ou bloqueado por moderação fora da superfície da API pública.

Atalhos de slug da Web são resolvidos entre famílias de registro, mas clientes de API devem usar
as URLs canônicas retornadas pelos endpoints de leitura em vez de reconstruir a precedência
de rotas.

## Limites de taxa

Modelo de aplicação:

- Requisições anônimas: aplicadas por IP.
- Requisições autenticadas (token Bearer válido): aplicadas por bucket de usuário.
- Se o token estiver ausente/inválido, o comportamento volta para a aplicação por IP.
- Endpoints de escrita autenticados não devem retornar um `Unauthorized` simples quando
  o servidor sabe o motivo. Tokens ausentes, tokens inválidos/revogados e
  contas excluídas/banidas/desabilitadas devem receber texto acionável para que clientes
  CLI possam informar aos usuários o que os bloqueou.

- Leitura: 600/min por IP, 2400/min por chave
- Escrita: 45/min por IP, 180/min por chave
- Download: 30/min por IP, 180/min por chave (`/api/v1/download`)

Cabeçalhos:

- Compatibilidade legada: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Padronizados: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- Em `429`: `Retry-After`

Semântica dos cabeçalhos:

- `X-RateLimit-Reset`: segundos absolutos da época Unix
- `RateLimit-Reset`: segundos até a redefinição (atraso)
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
- Se `Retry-After` estiver ausente, use `RateLimit-Reset` como fallback (ou calcule a partir de `X-RateLimit-Reset`).

Origem do IP:

- Usa `cf-connecting-ip` (Cloudflare) para o IP do cliente por padrão.
- O ClawHub usa cabeçalhos de encaminhamento confiáveis para identificar IPs de clientes na borda.
- Se nenhum IP de cliente confiável estiver disponível, requisições anônimas de download usam um bucket de fallback com escopo de endpoint em vez de um único bucket global `ip:unknown`. Requisições anônimas de leitura/escrita ainda usam o bucket desconhecido compartilhado, para que o roteamento sem IP permaneça visível e conservador.

## Endpoints públicos (sem autenticação)

### `GET /api/v1/search`

Parâmetros de consulta:

- `q` (obrigatório): string de consulta
- `limit` (opcional): inteiro
- `highlightedOnly` (opcional): `true` para filtrar para skills destacadas
- `nonSuspiciousOnly` (opcional): `true` para ocultar skills suspeitas (`flagged.suspicious`)
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

- Os resultados são retornados em ordem de relevância (similaridade de embedding + reforços de tokens de slug/nome exatos + prioridade de popularidade a partir de downloads).
- A relevância é mais forte que a popularidade. Uma correspondência precisa de slug ou token de nome de exibição pode superar uma correspondência mais vaga com muito mais downloads.
- Texto ASCII é tokenizado em limites de palavras e pontuação. Por exemplo, `personal-map` contém um token autônomo `map`, enquanto `amap-jsapi-skill` contém `amap`, `jsapi` e `skill`; portanto, pesquisar por `map` dá a `personal-map` uma correspondência lexical mais forte que `amap-jsapi-skill`.
- Downloads são usados como uma pequena prioridade em escala logarítmica e critério de desempate, não como o sinal principal de classificação. Skills com muitos downloads podem ficar abaixo quando o texto da consulta é uma correspondência mais fraca.
- Estado de moderação suspeito ou oculto pode remover uma skill da pesquisa pública dependendo dos filtros do chamador e do status atual de moderação.

Orientação de descoberta para publicadores:

- Coloque os termos que os usuários literalmente pesquisarão no nome de exibição, no resumo e nas tags. Use um token de slug autônomo somente quando ele também for uma identidade estável que você deseja manter.
- Não renomeie um slug apenas para perseguir uma consulta, a menos que o novo slug seja um nome canônico melhor no longo prazo. Slugs antigos se tornam aliases de redirecionamento, mas a URL canônica, o slug exibido e os resumos de pesquisa futuros usam o novo slug.
- Aliases de renomeação preservam a resolução para URLs antigas e instalações que resolvem pelo registro, mas a classificação de pesquisa é baseada nos metadados canônicos da skill depois que a renomeação foi indexada. Estatísticas existentes permanecem com a skill.
- Se uma skill estiver inesperadamente invisível, verifique primeiro o estado de moderação com `clawhub inspect <slug>` enquanto estiver conectado antes de alterar metadados relacionados à classificação.

### `GET /api/v1/skills`

Parâmetros de consulta:

- `limit` (opcional): inteiro (1–200)
- `cursor` (opcional): cursor de paginação para qualquer ordenação que não seja `trending`
- `sort` (opcional): `updated` (padrão), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), `installsCurrent` (alias: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (opcional): `true` para ocultar skills suspeitas (`flagged.suspicious`)
- `nonSuspicious` (opcional): alias legado para `nonSuspiciousOnly`

Observações:

- `trending` classifica por instalações nos últimos 7 dias (baseado em telemetria).
- `createdAt` é estável para crawls de novas skills; `updated` muda quando skills existentes são republicadas.
- Quando `nonSuspiciousOnly=true`, ordenações baseadas em cursor podem retornar menos itens que `limit` em uma página porque skills suspeitas são filtradas após a recuperação da página.
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

- Slugs antigos criados por fluxos de renomeação/mesclagem de proprietário resolvem para a skill canônica.
- `metadata.os`: restrições de SO declaradas no frontmatter da skill (por exemplo, `["macos"]`, `["linux"]`). `null` se não declarado.
- `metadata.systems`: alvos de sistema Nix (por exemplo, `["aarch64-darwin", "x86_64-linux"]`). `null` se não declarado.
- `metadata` é `null` se a skill não tiver metadados de plataforma.
- `moderation` é incluído somente quando a skill está sinalizada ou o proprietário está visualizando-a.

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

- Proprietários e moderadores podem acessar detalhes de moderação para skills ocultas.
- Chamadores públicos só recebem `200` para skills visíveis já sinalizadas.
- Evidências são redigidas para chamadores públicos e incluem snippets brutos somente para proprietários/moderadores.

### `POST /api/v1/skills/{slug}/report`

Relata uma skill para análise de moderador. Relatórios são no nível da skill, opcionalmente vinculados
a uma versão, e alimentam a fila de relatórios de skills.

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

### `POST /api/v1/skills/{slug}/appeal`

Endpoint de proprietário/publicador da skill para recorrer de moderação em uma skill.

Autenticação:

- Requer um token de API para o proprietário da skill ou membro publicador.

Requisição:

```json
{ "version": "1.2.3", "message": "The flagged command is documented setup." }
```

Recursos são aceitos para resultados de skill ocultos, removidos, suspeitos, maliciosos ou
sinalizados pelo scanner. O ClawHub mantém um recurso aberto por skill.

Resposta:

```json
{
  "ok": true,
  "submitted": true,
  "alreadyOpen": false,
  "appealId": "skillAppeals:...",
  "skillId": "skills:...",
  "status": "open"
}
```

### `POST /api/v1/skills/{slug}/rescan`

Solicita uma nova varredura de segurança para a versão publicada mais recente da skill.

Autenticação:

- Requer um token de API para o proprietário da skill, administrador publicador, moderador
  da plataforma ou administrador da plataforma.
- Proprietários e administradores publicadores estão sujeitos ao limite de recuperação do
  proprietário por versão. Moderadores e administradores da plataforma não estão, mas o ClawHub ainda permite apenas
  uma nova varredura ativa por versão.

Resposta:

```json
{
  "ok": true,
  "targetKind": "skill",
  "name": "gifgrep",
  "version": "1.2.3",
  "status": "in_progress",
  "remainingRequests": 2,
  "maxRequests": 3,
  "pendingRequestId": "rescanRequests:..."
}
```

### `GET /api/v1/skills/-/reports`

Endpoint de moderador/administrador para entrada de relatórios de skills.

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

Endpoint de moderador/administrador para resolver ou reabrir relatórios de skills.

Requisição:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` é obrigatório para `confirmed` e `dismissed`; pode ser omitido ao
definir `status` de volta para `open`. Passe `finalAction: "hide"` com um relatório
triado para ocultar a skill no mesmo fluxo de trabalho auditável.

### `GET /api/v1/skills/-/appeals`

Endpoint de moderador/administrador para entrada de recursos de skills.

Parâmetros de consulta:

- `status` (opcional): `open` (padrão), `accepted`, `rejected` ou `all`
- `limit` (opcional): inteiro (1-200)
- `cursor` (opcional): cursor de paginação

### `POST /api/v1/skills/-/appeals/{appealId}/resolve`

Endpoint de moderador/administrador para aceitar, rejeitar ou reabrir um recurso de skill.
`note` é obrigatório para `accepted` e `rejected`; pode ser omitido ao definir
`status` de volta para `open`. Passe `finalAction: "restore"` com um recurso aceito
para disponibilizar a skill novamente.

### `GET /api/v1/skills/{slug}/versions`

Parâmetros de consulta:

- `limit` (opcional): inteiro
- `cursor` (opcional): cursor de paginação

### `GET /api/v1/skills/{slug}/versions/{version}`

Retorna metadados da versão + lista de arquivos.

- `version.security` inclui o status normalizado de verificação de varredura e detalhes do scanner
  (VirusTotal + LLM), quando disponíveis.

### `GET /api/v1/skills/{slug}/scan`

Retorna detalhes de verificação da varredura de segurança para uma versão de skill.

Parâmetros de consulta:

- `version` (opcional): string de versão específica.
- `tag` (opcional): resolve uma versão marcada (por exemplo `latest`).

Observações:

- Se nem `version` nem `tag` forem fornecidos, usa a versão mais recente.
- Inclui status normalizado de verificação mais detalhes específicos do scanner.
- `security.capabilityTags` inclui rótulos determinísticos de capacidade/risco, como
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token` e `posts-externally` quando detectados.
- `security.hasScanResult` é `true` somente quando um scanner produziu um veredito definitivo (`clean`, `suspicious` ou `malicious`).
- `moderation` é um snapshot atual de moderação no nível da skill derivado da versão mais recente.
- Ao consultar uma versão histórica, verifique `moderation.matchesRequestedVersion` e `moderation.sourceVersion` antes de tratar `moderation` e `security` como o mesmo contexto de versão.

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
- plugins de pacote

Parâmetros de consulta:

- `limit` (opcional): inteiro (1–100)
- `cursor` (opcional): cursor de paginação
- `family` (opcional): `skill`, `code-plugin` ou `bundle-plugin`
- `channel` (opcional): `official`, `community` ou `private`
- `isOfficial` (opcional): `true` ou `false`
- `executesCode` (opcional): `true` ou `false`
- `capabilityTag` (opcional): filtro de capacidade para pacotes de plugin
- `target` / `hostTarget` (opcional): atalho para `host:<target>`
- `os`, `arch`, `libc` (opcional): atalho para filtros de capacidade de host
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (opcional): atalho `true`/`1` para tags de requisito de ambiente
- `externalService`, `binary`, `osPermission` (opcional): atalho para tags nomeadas
  de requisito de ambiente
- `artifactKind` (opcional): `legacy-zip` ou `npm-pack`
- `npmMirror` (opcional): `true`/`1` para mostrar versões de pacote baseadas no ClawPack
  disponíveis pelo espelho npm

Observações:

- `GET /api/v1/code-plugins` e `GET /api/v1/bundle-plugins` permanecem aliases de família fixa.
- As entradas de skill continuam respaldadas pelo registro de skills e ainda só podem ser publicadas por meio de `POST /api/v1/skills`.
- `POST /api/v1/packages` ainda é apenas para lançamentos de code-plugin e bundle-plugin.
- Chamadores anônimos veem apenas canais de pacotes públicos.
- Chamadores autenticados podem ver pacotes privados de publishers aos quais pertencem em resultados de listagem/busca.
- `channel=private` retorna apenas pacotes que o chamador autenticado pode ler.

### `GET /api/v1/packages/search`

Busca de catálogo unificado entre skills + pacotes de plugin.

Parâmetros de consulta:

- `q` (obrigatório): string de consulta
- `limit` (opcional): inteiro (1–100)
- `family` (opcional): `skill`, `code-plugin` ou `bundle-plugin`
- `channel` (opcional): `official`, `community` ou `private`
- `isOfficial` (opcional): `true` ou `false`
- `executesCode` (opcional): `true` ou `false`
- `capabilityTag` (opcional): filtro de capacidade para pacotes de plugin
- `target` / `hostTarget`, `os`, `arch`, `libc`, `requiresBrowser`,
  `requiresDesktop`, `requiresNativeDeps`, `requiresExternalService`,
  `requiresBinary`, `requiresOsPermission`, `externalService`, `binary` e
  `osPermission` são aceitos como atalhos para tags de capacidade comuns
- `artifactKind` (opcional): `legacy-zip` ou `npm-pack`
- `npmMirror` (opcional): `true`/`1` para buscar versões de pacote baseadas no ClawPack
  disponíveis pelo espelho npm

Observações:

- Chamadores anônimos veem apenas canais de pacotes públicos.
- Chamadores autenticados podem buscar pacotes privados de publishers aos quais pertencem.
- `channel=private` retorna apenas pacotes que o chamador autenticado pode ler.
- Filtros de artefato são respaldados por tags de capacidade indexadas:
  `artifact:legacy-zip`, `artifact:npm-pack` e `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

Retorna metadados detalhados do pacote.

Observações:

- Skills também podem ser resolvidas por esta rota no catálogo unificado.
- Pacotes privados retornam `404`, a menos que o chamador possa ler o publisher proprietário.

### `DELETE /api/v1/packages/{name}`

Exclui de forma reversível um pacote e todos os lançamentos.

Observações:

- Requer um token de API para o proprietário do pacote, um proprietário/admin de publisher da organização,
  moderador da plataforma ou admin da plataforma.

### `GET /api/v1/packages/{name}/versions`

Retorna histórico de versões.

Parâmetros de consulta:

- `limit` (opcional): inteiro (1–100)
- `cursor` (opcional): cursor de paginação

Observações:

- Pacotes privados retornam `404`, a menos que o chamador possa ler o publisher proprietário.

### `GET /api/v1/packages/{name}/versions/{version}`

Retorna uma versão do pacote, incluindo metadados de arquivos, compatibilidade,
capacidades, verificação, metadados de artefato e dados de varredura.

Observações:

- `version.artifact.kind` é `legacy-zip` para arquivos de pacote antigos ou
  `npm-pack` para lançamentos baseados no ClawPack.
- Lançamentos ClawPack incluem campos compatíveis com npm `npmIntegrity`, `npmShasum` e
  `npmTarballName`.
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis` e `version.staticScan` são incluídos quando existem dados de varredura.
- Pacotes privados retornam `404`, a menos que o chamador possa ler o publisher proprietário.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Retorna os metadados explícitos do resolvedor de artefato para uma versão de pacote.

Observações:

- Versões de pacote legadas retornam um artefato `legacy-zip` e uma
  `downloadUrl` de ZIP legado.
- Versões ClawPack retornam um artefato `npm-pack`, campos de integridade npm, uma
  `tarballUrl` e a URL de compatibilidade com ZIP legado.
- Esta é a superfície do resolvedor do OpenClaw; ela evita inferir o formato do arquivo a partir
  de uma URL compartilhada.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Baixa o artefato da versão pelo caminho explícito do resolvedor.

Observações:

- Versões ClawPack transmitem exatamente os bytes `.tgz` de npm-pack enviados.
- Versões ZIP legadas redirecionam para `/api/v1/packages/{name}/download?version=`.
- Usa o bucket de taxa de download.

### `GET /api/v1/packages/{name}/readiness`

Retorna a prontidão calculada para consumo futuro pelo OpenClaw.

As verificações de prontidão cobrem:

- status do canal oficial
- disponibilidade da versão mais recente
- disponibilidade de artefato npm-pack do ClawPack
- digest do artefato
- procedência do repositório de origem e do commit
- metadados de compatibilidade com OpenClaw
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

Endpoint de moderador para listar linhas de migração de plugins oficiais do OpenClaw.

Autenticação:

- Requer um token de API para um usuário moderador ou admin.

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

Endpoint de admin para criar ou atualizar uma linha de migração de plugin oficial.

Autenticação:

- Requer um token de API para um usuário admin.

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
- Isto rastreia apenas a prontidão da migração. Não modifica o OpenClaw nem gera
  ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Endpoint de moderador/admin para filas de revisão de lançamentos de pacotes.

Autenticação:

- Requer um token de API para um usuário moderador ou admin.

Parâmetros de consulta:

- `status` (opcional): `open` (padrão), `blocked`, `manual` ou `all`
- `limit` (opcional): inteiro (1-100)
- `cursor` (opcional): cursor de paginação

Significados de status:

- `open`: lançamentos suspeitos, maliciosos, pendentes, em quarentena, revogados ou reportados.
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

Reporta um pacote para revisão de moderador. As denúncias são no nível do pacote, opcionalmente
vinculadas a uma versão. Elas alimentam a fila de moderação, mas não ocultam automaticamente nem
bloqueiam downloads por conta própria; moderadores devem usar a moderação de lançamento para
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

### `POST /api/v1/packages/{name}/appeal`

Endpoint de proprietário/publisher do pacote para recorrer da moderação em um lançamento.

Autenticação:

- Requer um token de API para o proprietário do pacote ou membro do publisher.

Requisição:

```json
{
  "version": "1.2.3",
  "message": "The native binary is signed and matches the linked source release."
}
```

Recursos são aceitos somente para lançamentos que estejam em quarentena, revogados,
suspeitos ou maliciosos. O ClawHub mantém um recurso aberto por lançamento.

Resposta:

```json
{
  "ok": true,
  "submitted": true,
  "alreadyOpen": false,
  "appealId": "packageAppeals:...",
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "status": "open"
}
```

### `POST /api/v1/packages/{name}/rescan`

Solicita uma nova varredura de segurança para a versão de pacote publicada mais recente.

Autenticação:

- Requer um token de API para o proprietário do pacote, administrador do publicador,
  moderador da plataforma ou administrador da plataforma.
- Proprietários e administradores de publicadores estão sujeitos ao limite de
  recuperação por proprietário por versão. Moderadores e administradores da plataforma não estão, mas o ClawHub ainda permite apenas
  uma nova varredura ativa por versão.

Resposta:

```json
{
  "ok": true,
  "targetKind": "package",
  "name": "@openclaw/example-plugin",
  "version": "1.2.3",
  "status": "in_progress",
  "remainingRequests": 2,
  "maxRequests": 3,
  "pendingRequestId": "rescanRequests:..."
}
```

### `GET /api/v1/packages/appeals`

Endpoint de moderador/administrador para recebimento de apelações de pacotes.

Autenticação:

- Requer um token de API para um usuário moderador ou administrador.

Parâmetros de consulta:

- `status` (opcional): `open` (padrão), `accepted`, `rejected` ou `all`
- `limit` (opcional): inteiro (1-100)
- `cursor` (opcional): cursor de paginação

Resposta:

```json
{
  "items": [
    {
      "appealId": "packageAppeals:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "message": "The native binary is signed.",
      "status": "open",
      "createdAt": 1730000000000,
      "submitter": {
        "userId": "users:...",
        "handle": "publisher",
        "displayName": "Publisher"
      },
      "resolvedAt": null,
      "resolvedBy": null,
      "resolutionNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/appeals/{appealId}/resolve`

Endpoint de moderador/administrador para aceitar, rejeitar ou reabrir uma apelação.

Requisição:

```json
{ "status": "accepted", "note": "False positive confirmed.", "finalAction": "approve" }
```

`note` é obrigatório para `accepted` e `rejected`; pode ser omitido ao
definir `status` de volta para `open`. Passe `finalAction: "approve"` com uma
apelação aceita para aprovar a versão afetada no mesmo fluxo de trabalho auditável.

Resposta:

```json
{
  "ok": true,
  "appealId": "packageAppeals:...",
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "status": "rejected"
}
```

### `GET /api/v1/packages/reports`

Endpoint de moderador/administrador para recebimento de denúncias de pacotes.

Autenticação:

- Requer um token de API para um usuário moderador ou administrador.

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

- Requer um token de API para o proprietário do pacote, membro do publicador, moderador ou
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

Endpoint de moderador/administrador para resolver ou reabrir denúncias de pacotes.

Requisição:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` é obrigatório para `confirmed` e `dismissed`; pode ser omitido ao
definir `status` de volta para `open`. Passe `finalAction: "quarantine"` ou
`finalAction: "revoke"` com uma denúncia confirmada para aplicar a moderação da versão no
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

Endpoint de moderador/administrador para revisão de versões de pacotes.

Requisição:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Estados compatíveis:

- `approved`: revisada manualmente e permitida.
- `quarantined`: bloqueada enquanto aguarda acompanhamento.
- `revoked`: bloqueada depois que uma versão era anteriormente confiável.

Versões em quarentena e revogadas retornam `403` nas rotas de download de artefatos.
Toda alteração grava uma entrada no log de auditoria.

### `POST /api/v1/packages/backfill/artifacts`

Endpoint de manutenção somente para administradores para rotular versões de pacotes mais antigas com
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

- O padrão é execução de simulação.
- Versões sem armazenamento ClawPack são rotuladas como `legacy-zip`.
- Linhas existentes baseadas em ClawPack sem `artifactKind` são reparadas como
  `npm-pack`.
- Isso não gera ClawPacks nem modifica bytes de artefato.

### `GET /api/v1/packages/{name}/file`

Retorna conteúdo de texto bruto de um arquivo de pacote.

Parâmetros de consulta:

- `path` (obrigatório)
- `version` (opcional)
- `tag` (opcional)

Observações:

- O padrão é a versão mais recente.
- Usa o bucket de taxa de leitura, não o bucket de download.
- Arquivos binários retornam `415`.
- Limite de tamanho de arquivo: 200 KB.
- Varreduras pendentes do VirusTotal não bloqueiam leituras; versões maliciosas ainda podem ser retidas em outros lugares.
- Pacotes privados retornam `404`, a menos que o chamador possa ler o publicador proprietário.

### `GET /api/v1/packages/{name}/download`

Baixa o arquivo ZIP determinístico legado de uma versão de pacote.

Parâmetros de consulta:

- `version` (opcional)
- `tag` (opcional)

Observações:

- O padrão é a versão mais recente.
- Skills redirecionam para `GET /api/v1/download`.
- Arquivos de Plugin/pacote são arquivos zip com uma raiz `package/` para que clientes antigos do OpenClaw
  continuem funcionando.
- Esta rota permanece somente ZIP. Ela não transmite arquivos ClawPack `.tgz`.
- As respostas incluem cabeçalhos `ETag`, `Digest`, `X-ClawHub-Artifact-Type` e
  `X-ClawHub-Artifact-Sha256` para verificações de integridade do resolvedor.
- Metadados apenas do registro não são injetados no arquivo baixado.
- Varreduras pendentes do VirusTotal não bloqueiam downloads; versões maliciosas retornam `403`.
- Pacotes privados retornam `404`, a menos que o chamador seja o proprietário.

### `GET /api/npm/{package}`

Retorna um packument compatível com npm para versões de pacote baseadas em ClawPack.

Observações:

- Somente versões com tarballs npm-pack ClawPack enviados são listadas.
- Versões legadas somente ZIP são omitidas intencionalmente.
- `dist.tarball`, `dist.integrity` e `dist.shasum` usam campos compatíveis com npm
  para que os usuários possam apontar o npm para o espelho, se escolherem.
- Packuments de pacotes com escopo são compatíveis tanto com `/api/npm/@scope/name` quanto com o caminho de requisição
  codificado do npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Transmite os bytes exatos do tarball ClawPack enviado para clientes de espelho npm.

Observações:

- Usa o bucket de taxa de download.
- Os cabeçalhos de download incluem SHA-256 do ClawHub mais metadados de integridade/shasum do npm.
- Verificações de moderação e de acesso a pacotes privados ainda se aplicam.

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
- As estatísticas de download são contadas como identidades únicas por hora (`userId` quando o token de API é válido, caso contrário IP).

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
- Campo opcional do payload: `ownerHandle`. Quando presente, a API resolve esse
  publicador no servidor e exige que o ator tenha acesso ao publicador.
- Campo opcional do payload: `migrateOwner`. Quando `true` com `ownerHandle`, uma
  skill existente pode ser movida para esse proprietário se o ator for administrador/proprietário em ambos
  os publicadores atual e de destino. Sem essa opção explícita, alterações de proprietário são
  rejeitadas.

### `POST /api/v1/packages`

Publica uma versão de code-plugin ou bundle-plugin.

- Requer autenticação por token Bearer.
- Preferencial: `multipart/form-data` com JSON `payload` + blobs `files[]`.
- Corpo JSON com `files` (baseado em storageId) também é aceito.
- Campo opcional do payload: `ownerHandle`. Quando presente, somente administradores podem publicar em nome desse proprietário.

Destaques de validação:

- `family` deve ser `code-plugin` ou `bundle-plugin`.
- Pacotes de Plugin exigem `openclaw.plugin.json`. Envios ClawPack `.tgz` devem
  contê-lo em `package/openclaw.plugin.json`.
- Plugins de código exigem `package.json`, metadados de repositório de origem, metadados de commit de origem,
  metadados de esquema de configuração, `openclaw.compat.pluginApi` e
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` e `openclaw.environment` são metadados opcionais.
- Somente publicadores confiáveis podem publicar no canal `official`.
- Publicações em nome de terceiros ainda validam a elegibilidade para o canal oficial em relação à conta do proprietário de destino.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Exclui de forma reversível / restaura uma skill (proprietário, moderador ou administrador).

Corpo JSON opcional:

```json
{ "reason": "Held for moderation pending legal review." }
```

Quando presente, `reason` é armazenado como a nota de moderação da skill e copiado para o log de auditoria.
Exclusões reversíveis iniciadas pelo proprietário reservam o slug por 30 dias; depois, o slug pode ser reivindicado por
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

Somente administradores. Garante que um publicador de organização exista para um identificador. Se o identificador ainda apontar para um
publicador legado compartilhado de usuário/pessoal, o endpoint o migra primeiro para um publicador de organização.

- Corpo: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Resposta: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Somente administradores. Reserva slugs raiz e nomes de pacote para um proprietário legítimo sem publicar uma
versão. Nomes de pacote se tornam pacotes placeholder privados sem linhas de versão, para que o mesmo
proprietário possa publicar posteriormente a versão real do code-plugin ou bundle-plugin nesse nome.

- Corpo: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Resposta: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### Endpoints de gerenciamento de slug do proprietário

- `POST /api/v1/skills/{slug}/rename`
  - Corpo: `{ "newSlug": "new-canonical-slug" }`
  - Resposta: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Corpo: `{ "targetSlug": "canonical-target-slug" }`
  - Resposta: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Observações:

- Ambos os endpoints exigem autenticação por token de API e só funcionam para o proprietário da habilidade.
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

Bane um usuário e exclui permanentemente as habilidades pertencentes a ele (somente moderador/administrador).

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

Remove o banimento de um usuário e restaura habilidades elegíveis (somente administrador).

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

Ainda compatíveis com versões mais antigas da CLI:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Consulte `DEPRECATIONS.md` para o plano de remoção.

## Descoberta de registro (`/.well-known/clawhub.json`)

A CLI pode descobrir configurações de registro/autenticação pelo site:

- `/.well-known/clawhub.json` (JSON, preferido)
- `/.well-known/clawdhub.json` (legado)

Esquema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Se você fizer self-hosting, sirva este arquivo (ou defina `CLAWHUB_REGISTRY` explicitamente; legado `CLAWDHUB_REGISTRY`).
