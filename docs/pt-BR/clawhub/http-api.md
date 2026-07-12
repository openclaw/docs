---
read_when:
    - Adição/alteração de endpoints
    - Depuração de solicitações entre a CLI e o registro
summary: Referência da API HTTP (endpoints públicos + da CLI + autenticação).
x-i18n:
    generated_at: "2026-07-12T14:56:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

URL base: `https://clawhub.ai` (padrão).

Todos os caminhos v1 ficam em `/api/v1/...`.
Os caminhos legados `/api/...` e `/api/cli/...` permanecem para compatibilidade (consulte `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Reutilização do catálogo público

Diretórios de terceiros podem usar os endpoints públicos de leitura para listar ou pesquisar Skills do ClawHub. Armazene os resultados em cache, respeite `429`/`Retry-After`, direcione os usuários de volta à listagem canônica do ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) e evite sugerir que o ClawHub endossa o site de terceiros. Não tente espelhar conteúdo oculto, privado ou bloqueado pela moderação fora da superfície da API pública.

Os atalhos de slug na Web são resolvidos entre famílias de registro, mas os clientes da API devem usar
as URLs canônicas retornadas pelos endpoints de leitura em vez de reconstruir a
precedência das rotas.

## Limites de taxa

Modelo de aplicação:

- Solicitações anônimas: aplicadas por IP.
- Solicitações autenticadas (token Bearer válido): aplicadas por cota de usuário.
- Se o token estiver ausente ou for inválido, o comportamento volta à aplicação por IP.
- Endpoints autenticados de escrita não devem retornar apenas `Unauthorized` quando
  o servidor souber o motivo. Tokens ausentes, tokens inválidos/revogados e
  contas excluídas/banidas/desativadas devem receber textos específicos e úteis para que os clientes
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

- `X-RateLimit-Reset`: segundos absolutos desde a época Unix
- `RateLimit-Reset`: segundos até a redefinição (atraso)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: orçamento restante exato, quando presente.
  Solicitações bem-sucedidas fragmentadas omitem esse cabeçalho em vez de retornar um valor global aproximado.
- `Retry-After`: segundos de espera antes de tentar novamente (atraso) em `429`

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

Limite de taxa excedido
```

Orientações para clientes:

- Se `Retry-After` existir, aguarde essa quantidade de segundos antes de tentar novamente.
- Use recuo com variação aleatória para evitar novas tentativas sincronizadas.
- Se `Retry-After` estiver ausente, use `RateLimit-Reset` como alternativa (ou calcule com base em `X-RateLimit-Reset`).

Origem do IP:

- Usa cabeçalhos confiáveis de IP do cliente, incluindo `cf-connecting-ip`, somente quando a
  implantação habilita explicitamente cabeçalhos encaminhados confiáveis.
- O ClawHub usa cabeçalhos de encaminhamento confiáveis para identificar os IPs dos clientes na borda.
- Se nenhum IP confiável do cliente estiver disponível, as solicitações anônimas usam cotas alternativas
  delimitadas somente pelo tipo de limite de taxa. Essas cotas alternativas não incluem
  caminhos, slugs, nomes de pacotes, versões, strings de consulta ou outros
  parâmetros de artefato fornecidos pelo chamador.

## Respostas de erro

As respostas de erro públicas da v1 são texto simples com `content-type: text/plain; charset=utf-8`.
Isso inclui falhas de validação (`400`), recursos públicos ausentes (`404`), falhas de autenticação e
permissão (`401`/`403`), limites de taxa (`429`) e downloads bloqueados. Os clientes
devem ler o corpo da resposta como uma string legível por humanos. Parâmetros de consulta desconhecidos são
ignorados para fins de compatibilidade, mas parâmetros de consulta reconhecidos com valores inválidos retornam
`400`.

## Endpoints públicos (sem autenticação)

### `GET /api/v1/search`

Parâmetros de consulta:

- `q` (obrigatório): string de consulta
- `limit` (opcional): número inteiro
- `highlightedOnly` (opcional): `true` para filtrar somente Skills em destaque
- `nonSuspiciousOnly` (opcional): `true` para ocultar Skills suspeitas (`flagged.suspicious`)
- `nonSuspicious` (opcional): alias legado de `nonSuspiciousOnly`

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

- Os resultados são retornados em ordem de relevância (similaridade de embeddings + reforços por correspondência exata de tokens de slug/nome + uma pequena ponderação prévia de popularidade).
- A relevância tem mais peso que a popularidade. Uma correspondência precisa de token de slug ou nome de exibição pode superar uma correspondência menos precisa com engajamento muito maior.
- O texto ASCII é tokenizado nos limites de palavras e pontuação. Por exemplo, `personal-map` contém um token `map` independente, enquanto `amap-jsapi-skill` contém `amap`, `jsapi` e `skill`; portanto, pesquisar `map` atribui a `personal-map` uma correspondência lexical mais forte que a de `amap-jsapi-skill`.
- A popularidade usa escala logarítmica e possui um limite máximo. Skills com alto engajamento podem aparecer em posições inferiores quando o texto da consulta tiver uma correspondência mais fraca.
- Um estado de moderação suspeito ou oculto pode remover uma Skill da pesquisa pública, dependendo dos filtros do chamador e do estado atual da moderação.

Orientações de descoberta para publicadores:

- Inclua no nome de exibição, no resumo e nas tags os termos que os usuários pesquisarão literalmente. Use um token de slug independente somente quando ele também for uma identidade estável que você deseja manter.
- Não renomeie um slug apenas para favorecer uma consulta, a menos que o novo slug seja um nome canônico melhor a longo prazo. Slugs antigos tornam-se aliases de redirecionamento, mas a URL canônica, o slug exibido e os futuros resumos de pesquisa usam o novo slug.
- Os aliases de renomeação preservam a resolução de URLs antigas e instalações resolvidas pelo registro, mas a classificação da pesquisa se baseia nos metadados canônicos da Skill após a indexação da renomeação. As estatísticas existentes permanecem com a Skill.
- Se uma Skill estiver inesperadamente invisível, verifique primeiro o estado da moderação com `clawhub inspect @owner/slug` enquanto estiver conectado, antes de alterar metadados relacionados à classificação.

### `GET /api/v1/skills`

Parâmetros de consulta:

- `limit` (opcional): número inteiro (1–200)
- `cursor` (opcional): cursor de paginação para qualquer ordenação diferente de `trending`
- `sort` (opcional): `updated` (padrão), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), aliases legados de instalação `installsCurrent`/`installs`/`installsAllTime` são mapeados para `downloads`, `trending`
- `nonSuspiciousOnly` (opcional): `true` para ocultar Skills suspeitas (`flagged.suspicious`)
- `nonSuspicious` (opcional): alias legado de `nonSuspiciousOnly`

Valores inválidos de `sort` retornam `400`.

Observações:

- `recommended` usa sinais de engajamento e recência.
- `trending` classifica pelas instalações nos últimos 7 dias (com base em telemetria).
- `createdAt` é estável para rastreamentos de novas Skills; `updated` muda quando Skills existentes são republicadas.
- Quando `nonSuspiciousOnly=true`, ordenações baseadas em cursor podem retornar menos de `limit` itens em uma página porque Skills suspeitas são filtradas após a recuperação da página.
- Use `nextCursor` para continuar a paginação quando estiver presente. Uma página curta não significa, por si só, que os resultados terminaram.

Resposta:

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "topics": ["Produtividade"],
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
    "topics": ["Produtividade"],
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

- Slugs antigos criados por fluxos de renomeação/mesclagem do proprietário são resolvidos para a Skill canônica.
- `metadata.os`: restrições de sistema operacional declaradas no frontmatter da Skill (por exemplo, `["macos"]`, `["linux"]`). `null` quando não declaradas.
- `metadata.systems`: sistemas de destino do Nix (por exemplo, `["aarch64-darwin", "x86_64-linux"]`). `null` quando não declarados.
- `metadata` é `null` quando a Skill não possui metadados de plataforma.
- `moderation` é incluído somente quando a Skill está sinalizada ou quando o proprietário a está visualizando.

### `GET /api/v1/skills/{slug}/moderation`

Retorna o estado estruturado da moderação.

Resposta:

```json
{
  "moderation": {
    "isSuspicious": true,
    "isMalwareBlocked": false,
    "verdict": "suspicious",
    "reasonCodes": ["suspicious.dynamic_code_execution"],
    "summary": "Detectado: suspicious.dynamic_code_execution",
    "engineVersion": "v2.0.0",
    "updatedAt": 0,
    "legacyReason": null,
    "evidence": [
      {
        "code": "suspicious.dynamic_code_execution",
        "severity": "critical",
        "file": "index.ts",
        "line": 3,
        "message": "Execução dinâmica de código detectada.",
        "evidence": ""
      }
    ]
  }
}
```

Observações:

- Proprietários e moderadores podem acessar detalhes de moderação de Skills ocultas.
- Chamadores públicos recebem `200` somente para Skills visíveis que já estejam sinalizadas.
- As evidências são editadas para chamadores públicos e incluem trechos brutos somente para proprietários/moderadores.

### `POST /api/v1/skills/{slug}/report`

Denuncia uma Skill para análise da moderação. As denúncias são feitas no nível da Skill, opcionalmente vinculadas
a uma versão, e alimentam a fila de denúncias de Skills.

Autenticação:

- Requer um token de API.

Solicitação:

```json
{ "reason": "Etapa de instalação suspeita", "version": "1.2.3" }
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

Endpoint de moderador/administrador para recebimento de denúncias de Skills.

Parâmetros de consulta:

- `status` (opcional): `open` (padrão), `confirmed`, `dismissed` ou `all`
- `limit` (opcional): número inteiro (1-200)
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
      "reason": "Etapa de instalação suspeita",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Denunciante"
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

Endpoint de moderador/administrador para resolver ou reabrir denúncias de Skills.

Solicitação:

```json
{ "status": "confirmed", "note": "Analisada e versão afetada ocultada.", "finalAction": "hide" }
```

`note` é obrigatório para `confirmed` e `dismissed`; pode ser omitido ao
redefinir `status` como `open`. Passe `finalAction: "hide"` com uma denúncia
triada para ocultar a Skill no mesmo fluxo de trabalho auditável.

### `GET /api/v1/skills/{slug}/versions`

Parâmetros de consulta:

- `limit` (opcional): número inteiro
- `cursor` (opcional): cursor de paginação

### `GET /api/v1/skills/{slug}/versions/{version}`

Retorna os metadados da versão + a lista de arquivos.

- `version.security` inclui o estado normalizado de verificação da análise e detalhes do scanner
  (VirusTotal + LLM), quando disponíveis.

### `GET /api/v1/skills/{slug}/scan`

Retorna os detalhes de verificação da análise de segurança para uma versão da Skill.

Parâmetros de consulta:

- `version` (opcional): string de versão específica.
- `tag` (opcional): resolve uma versão marcada (por exemplo, `latest`).

Observações:

- Se nem `version` nem `tag` forem fornecidos, usa a versão mais recente.
- Inclui o status de verificação normalizado e detalhes específicos do scanner.
- `security.hasScanResult` é `true` somente quando um scanner produz um veredito definitivo (`clean`, `suspicious` ou `malicious`).
- `moderation` é um snapshot atual da moderação no nível da skill, derivado da versão mais recente.
- Ao consultar uma versão histórica, verifique `moderation.matchesRequestedVersion` e `moderation.sourceVersion` antes de considerar `moderation` e `security` como pertencentes ao mesmo contexto de versão.

### `POST /api/v1/skills/-/scan`

Endpoint autenticado de envio para novos trabalhos do ClawScan.

As verificações de uploads locais não são mais compatíveis. As solicitações que usam
`multipart/form-data` ou `{ "source": { "kind": "upload" } }` retornam `410`.

As verificações publicadas usam JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Observações:

- As cargas úteis das solicitações de verificação e os relatórios para download expiram do armazenamento de solicitações de verificação após o período de retenção.
- As verificações publicadas exigem acesso de gerenciamento do proprietário/publicador ou autoridade de moderador/administrador da plataforma.
- As verificações publicadas só fazem a gravação de retorno quando `update: true` e a verificação é concluída com sucesso.
- A resposta é `202` com `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Os trabalhos de verificação são assíncronos. As solicitações manuais de verificação são priorizadas em relação ao trabalho normal de publicação/preenchimento retroativo, mas a conclusão ainda depende da disponibilidade dos workers.

### `GET /api/v1/skills/-/scan/{scanId}`

Endpoint autenticado de consulta periódica para uma verificação enviada.

- Retorna o status queued/running/succeeded/failed.
- Retorna `queue.queuedAhead` e `queue.position` enquanto estiver na fila, para que os clientes possam mostrar quantas verificações manuais priorizadas estão à frente da solicitação. Filas muito grandes são limitadas e informadas com `queuedAheadIsEstimate: true`.
- Quando disponível, `report` contém as seções `clawscan`, `skillspector`, `staticAnalysis` e `virustotal`.
- Trabalhos de verificação com falha retornam `status: "failed"` com `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Endpoint autenticado do arquivo de relatório.

- Exige uma verificação concluída com sucesso; verificações não terminais retornam `409`.
- Retorna um ZIP com `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` e `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Endpoint autenticado do arquivo de relatório armazenado para versões enviadas.

- Exige acesso de gerenciamento do proprietário/publicador à skill ou ao plugin, ou autoridade de moderador/administrador da plataforma.
- Retorna os resultados armazenados da verificação para a versão exata enviada, incluindo versões bloqueadas ou ocultas.
- O padrão de `kind` é `skill`; use `kind=plugin` para verificações de plugins/pacotes.
- Retorna a mesma estrutura ZIP dos downloads de solicitações de verificação.

### `POST /api/v1/skills/-/scan/batch`

Rota canônica de nova verificação em lote, exclusiva para administradores. Ela aceita o mesmo formato de payload que a rota legada `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Rota canônica de status do lote, exclusiva para administradores. Ela aceita `{ "jobIds": ["..."] }` e retorna os mesmos contadores agregados que a rota legada `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Retorna o envelope de verificação do Skill Card usado por `clawhub skill verify`.

Parâmetros de consulta:

- `version` (opcional): string de versão específica.
- `tag` (opcional): resolve uma versão com tag (por exemplo, `latest`).

Observações:

- `ok` é `true` somente quando a versão selecionada tem um Skill Card gerado, não está bloqueada pela moderação por malware e a verificação do ClawScan não detecta problemas.
- A identidade da Skill, a identidade do publicador e os metadados da versão selecionada são campos de nível superior do envelope (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`), para que automações de shell possam lê-los sem desempacotar wrappers aninhados.
- `security` é o veredito de nível superior do ClawScan/segurança. A automação deve se basear em `ok`, `decision`, `reasons` e `security.status`.
- `security.signals` contém evidências de apoio dos scanners, como `staticScan`, `virusTotal` e `skillSpector`.
- `security.signals.dependencyRegistry` é mantido para compatibilidade com respostas da v1, mas o scanner de existência no registro de dependências foi desativado, e essa chave é sempre `null`.
- `provenance` é `server-resolved-github-import` somente quando o ClawHub resolveu e armazenou um repositório/ref/commit/caminho do GitHub durante a publicação ou importação; caso contrário, é `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Retorna os vereditos de segurança compactos atuais para versões exatas de Skills. Este
endpoint de coleção destina-se a clientes que já sabem quais versões instaladas de
Skills do ClawHub precisam exibir, como a interface de controle do OpenClaw.

Solicitação:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Observações:

- `items` deve conter de 1 a 100 pares únicos de `{ slug, version }`.
- Os resultados são individuais por item; uma Skill ou versão ausente não faz com que toda a resposta falhe.
- A resposta contém apenas informações de segurança. Ela não inclui dados do Skill Card, status de geração do cartão, listas de arquivos do artefato nem payloads detalhados dos scanners.
- `security.signals` contém somente evidências de apoio no nível de status; use `/scan` ou a página de auditoria de segurança do ClawHub para obter todos os detalhes dos scanners.
- `security.signals.dependencyRegistry` é mantido para compatibilidade com respostas da v1, mas o scanner de existência no registro de dependências foi desativado, e essa chave é sempre `null`.
- A ausência do Skill Card não afeta `ok`, `decision` nem `reasons` deste endpoint; os clientes devem ler localmente o `skill-card.md` instalado quando precisarem do conteúdo do cartão.
- Use `/verify` quando precisar do envelope de verificação do Skill Card de uma única Skill, `/card` quando precisar do Markdown do cartão gerado e `/scan` quando precisar de dados detalhados dos scanners.

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
      "error": { "code": "version_not_found", "message": "Versão não encontrada" },
      "security": null
    }
  ]
}
```

### `GET /api/v1/skills/{slug}/file`

Retorna o conteúdo de texto bruto.

Parâmetros de consulta:

- `path` (obrigatório)
- `version` (opcional)
- `tag` (opcional)

Observações:

- Usa como padrão a versão mais recente.
- Limite de tamanho do arquivo: 200KB.

### `GET /api/v1/packages`

Endpoint de catálogo unificado para:

- Skills
- plugins de código
- plugins de pacote

Parâmetros de consulta:

- `limit` (opcional): inteiro (1–100)
- `cursor` (opcional): cursor de paginação
- `family` (opcional): `skill`, `code-plugin` ou `bundle-plugin`
- `channel` (opcional): `official`, `community` ou `private`
- `isOfficial` (opcional): `true` ou `false`
- `sort` (opcional): `updated` (padrão), `recommended`, `trending`, `downloads`, alias legado `installs`
- `category` (opcional): filtro de categoria de Plugin. Compatível apenas quando a
  solicitação está restrita a pacotes de Plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` ou endpoints de pacote com
  `family=code-plugin`/`family=bundle-plugin`). As categorias controladas e os
  aliases legados de filtro da v1 estão documentados em `GET /api/v1/plugins`.

Observações:

- Valores inválidos para `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` ou `sort` retornam `400`. Parâmetros de consulta desconhecidos são ignorados.
- `GET /api/v1/code-plugins` e `GET /api/v1/bundle-plugins` permanecem como aliases de família fixa.
- As entradas de Skills continuam respaldadas pelo registro de Skills e ainda só podem ser publicadas por meio de `POST /api/v1/skills`.
- `POST /api/v1/packages` continua sendo apenas para lançamentos de plugins de código e plugins de pacote.
- Chamadores anônimos veem apenas canais públicos de pacotes.
- Chamadores autenticados podem ver, nos resultados de listagem/pesquisa, pacotes privados de publicadores aos quais pertencem.
- `channel=private` retorna apenas pacotes que o chamador autenticado pode ler.

### `GET /api/v1/packages/search`

Pesquisa unificada no catálogo de Skills + pacotes de Plugin.

Parâmetros de consulta:

- `q` (obrigatório): string de consulta
- `limit` (opcional): inteiro (1–100)
- `family` (opcional): `skill`, `code-plugin` ou `bundle-plugin`
- `channel` (opcional): `official`, `community` ou `private`
- `isOfficial` (opcional): `true` ou `false`
- `category` (opcional): filtro de categoria de Plugin. Compatível apenas quando a
  solicitação está restrita a pacotes de Plugin. As categorias controladas e os aliases
  legados de filtro da v1 estão documentados em `GET /api/v1/plugins`.

Observações:

- Valores inválidos para `family`, `channel`, `isOfficial`, `featured` ou
  `highlightedOnly` retornam `400`. Parâmetros de consulta desconhecidos são ignorados.
- Chamadores anônimos veem apenas canais públicos de pacotes.
- Chamadores autenticados podem pesquisar pacotes privados de publicadores aos quais pertencem.
- `channel=private` retorna apenas pacotes que o chamador autenticado pode ler.

### `GET /api/v1/plugins`

Navegação no catálogo exclusivo de Plugins entre pacotes de plugins de código e plugins de pacote.

Parâmetros de consulta:

- `limit` (opcional): inteiro (1-100)
- `cursor` (opcional): cursor de paginação
- `isOfficial` (opcional): `true` ou `false`
- `sort` (opcional): `recommended` (padrão), `trending`, `downloads`, `updated`, alias legado `installs`
- `category` (opcional): filtro de categoria de Plugin. Valores atuais:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Os aliases legados de filtro da v1 continuam sendo aceitos nos endpoints de leitura:

- `mcp-tooling`, `data` e `automation` são resolvidos como `tools`.
- `observability` e `deployment` são resolvidos como `gateway`.
- `dev-tools` é resolvido como `runtime`.

`trending` é uma classificação de instalações/downloads dos últimos sete dias e não usa os totais históricos.
No endpoint unificado `/api/v1/packages`, ela é exclusiva de Plugins; use
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
- Cada Skill exportada tem como raiz `{publisher}/{slug}/`.
- As Skills hospedadas incluem os arquivos da versão armazenada mais recente e são listadas em
  `_manifest.json` com `sourceRef: "public-clawhub"`.
- As Skills atuais respaldadas pelo GitHub com uma verificação `clean` ou `suspicious` incluem
  `_source_handoff.json` com `sourceRef: "public-github"`, repositório, commit, caminho,
  hash do conteúdo e URL do arquivo. Elas não incluem arquivos-fonte hospedados no ClawHub.
- Cada Skill inclui `_export_skill_meta.json`.
- `_manifest.json` é sempre incluído na raiz do ZIP.
- `_errors.json` é incluído quando não foi possível exportar Skills ou arquivos
  individuais.

Cabeçalhos:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Exportação em massa das versões públicas mais recentes de plugins para análise offline.

Autenticação:

- Token de API obrigatório.

Parâmetros de consulta:

- `startDate` (obrigatório): limite inferior em milissegundos Unix para `updatedAt` do plugin.
- `endDate` (obrigatório): limite superior em milissegundos Unix para `updatedAt` do plugin.
- `limit` (opcional): inteiro (1-250), padrão `250`.
- `cursor` (opcional): cursor de paginação da resposta anterior.
- `family` (opcional): `code-plugin` ou `bundle-plugin`. Se omitido, inclui ambas as
  famílias de plugins.

Resposta:

- Corpo: arquivo ZIP.
- Cada plugin exportado tem como raiz `{family}/{packageName}/`.
- Cada plugin exportado inclui os arquivos armazenados da versão mais recente.
- Os metadados de exportação de cada plugin são armazenados em
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` é sempre incluído na raiz do ZIP.
- `_errors.json` é incluído quando não foi possível exportar plugins ou arquivos
  individuais.

Cabeçalhos:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Pesquisa exclusiva de plugins em pacotes code-plugin e bundle-plugin.

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
- A filtragem por categoria é um filtro real da API respaldado por linhas de resumo
  de categorias de plugins, não uma reescrita da consulta de pesquisa.
- Os resultados são retornados em ordem de relevância e atualmente não têm paginação.
- Os controles de ordenação da interface do navegador para pesquisa de plugins reordenam os resultados de relevância carregados,
  correspondendo ao comportamento atual de navegação em `/skills`.

### `GET /api/v1/packages/{name}`

Retorna metadados detalhados do pacote.

Observações:

- Skills também podem ser resolvidas por esta rota no catálogo unificado.
- Pacotes privados retornam `404`, a menos que o chamador possa ler o publicador proprietário.

### `DELETE /api/v1/packages/{name}`

Faz a exclusão lógica de um pacote e de todas as versões.

Observações:

- Requer um token de API do proprietário do pacote, de um proprietário/administrador da organização publicadora,
  de um moderador da plataforma ou de um administrador da plataforma.

### `GET /api/v1/packages/{name}/versions`

Retorna o histórico de versões.

Parâmetros de consulta:

- `limit` (opcional): inteiro (1–100)
- `cursor` (opcional): cursor de paginação

Observações:

- Pacotes privados retornam `404`, a menos que o chamador possa ler o publicador proprietário.

### `GET /api/v1/packages/{name}/versions/{version}`

Retorna uma versão do pacote, incluindo metadados de arquivos, compatibilidade,
verificação, metadados do artefato e dados de análise.

Observações:

- `version.artifact.kind` é `legacy-zip` para arquivos de pacotes antigos ou
  `npm-pack` para versões respaldadas pelo ClawPack.
- Versões do ClawPack incluem os campos compatíveis com npm `npmIntegrity`, `npmShasum` e
  `npmTarballName`.
- `version.sha256hash` é um metadado de compatibilidade obsoleto para clientes antigos. Ele
  calcula o hash dos bytes ZIP exatos retornados por `/api/v1/packages/{name}/download`.
  Clientes modernos devem usar `version.artifact.sha256`, que identifica o
  artefato canônico da versão.
- `version.vtAnalysis`, `version.llmAnalysis` e `version.staticScan` são
  incluídos quando existem dados de análise.
- Pacotes privados retornam `404`, a menos que o chamador possa ler o publicador proprietário.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Retorna o resumo exato de segurança e confiança da versão do pacote para clientes de
instalação. Esta é a interface pública de consumo do OpenClaw para decidir se uma
versão resolvida pode ser instalada.

Autenticação:

- Endpoint público de leitura. Nenhum token de proprietário, publicador, moderador ou administrador é
  necessário.

Resposta:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Plugin de exemplo",
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
  pacote resolvido no registro.
- `release.releaseId`, `release.version` e `release.createdAt` identificam a
  versão exata que foi avaliada.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` e `release.npmTarballName` estão presentes quando conhecidos para
  o artefato da versão.
- `trust.scanStatus` é o status efetivo de confiança derivado das entradas dos analisadores
  e da moderação manual da versão.
- `trust.moderationState` aceita valor nulo. É `null` quando não existe moderação manual
  da versão.
- `trust.blockedFromDownload` é o sinal de bloqueio da instalação. O OpenClaw e outros
  clientes de instalação devem bloquear a instalação quando esse valor for `true`, em vez de
  recalcular as regras de bloqueio a partir dos campos de análise ou moderação.
- `trust.reasons` é a lista de explicações para o usuário e para auditoria. Os códigos de motivo
  são strings compactas e estáveis, como `manual:quarantined`, `scan:malicious`
  e `package:malicious`.
- `trust.pending` significa que uma ou mais entradas de confiança ainda aguardam conclusão.
- `trust.stale` significa que o resumo de confiança foi calculado com entradas desatualizadas e
  deve ser tratado como exigindo atualização antes de uma decisão de permissão com alto grau de confiança.

Observações:

- Este endpoint é específico para uma versão exata. Os clientes devem chamá-lo depois de resolver a
  versão do pacote que pretendem instalar, não apenas depois de ler os metadados mais recentes
  do pacote.
- Pacotes privados retornam `404`, a menos que o chamador possa ler o publicador proprietário.
- Este endpoint é intencionalmente mais restrito que os endpoints de moderação de
  proprietários/moderadores. Ele expõe a decisão de instalação e a explicação pública, não
  as identidades dos denunciantes, o conteúdo das denúncias, evidências privadas ou cronogramas internos
  de análise.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Retorna os metadados explícitos do resolvedor de artefatos para uma versão do pacote.

Observações:

- Versões legadas de pacotes retornam um artefato `legacy-zip` e uma
  `downloadUrl` de ZIP legado.
- Versões do ClawPack retornam um artefato `npm-pack`, campos de integridade do npm, uma
  `tarballUrl` e a URL de compatibilidade com ZIP legado.
- Esta é a interface de resolução do OpenClaw; ela evita deduzir o formato do arquivo a partir
  de uma URL compartilhada.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Baixa o artefato da versão pelo caminho explícito do resolvedor.

Observações:

- Versões do ClawPack transmitem os bytes exatos do `.tgz` npm-pack enviado.
- Versões ZIP legadas redirecionam para `/api/v1/packages/{name}/download?version=`.
- Usa o bucket de limite de taxa de downloads.

### `GET /api/v1/packages/{name}/readiness`

Retorna a prontidão calculada para consumo futuro pelo OpenClaw.

As verificações de prontidão abrangem:

- status do canal oficial
- disponibilidade da versão mais recente
- disponibilidade do artefato npm-pack do ClawPack
- resumo criptográfico do artefato
- proveniência do repositório de origem e do commit
- metadados de compatibilidade com o OpenClaw
- destinos de host
- estado da análise

Resposta:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Plugin de exemplo",
    "family": "code-plugin",
    "isOfficial": true,
    "latestVersion": "1.2.3"
  },
  "ready": false,
  "checks": [
    {
      "id": "clawpack",
      "label": "Artefato do ClawPack",
      "status": "fail",
      "message": "A versão mais recente está disponível somente como ZIP legado."
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
      "blockers": ["ClawPack ausente"],
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
  "blockers": ["ClawPack ausente"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "aguardando o envio pelo publicador"
}
```

Observações:

- `bundledPluginId` é normalizado para letras minúsculas e é a chave estável de upsert.
- `packageName` é normalizado como nome npm; o pacote pode estar ausente em migrações
  planejadas.
- Isso acompanha apenas a prontidão da migração. Não modifica o OpenClaw nem gera
  ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Endpoint de moderador/administrador para filas de análise de versões de pacotes.

Autenticação:

- Requer um token de API de um usuário moderador ou administrador.

Parâmetros de consulta:

- `status` (opcional): `open` (padrão), `blocked`, `manual` ou `all`
- `limit` (opcional): inteiro (1-100)
- `cursor` (opcional): cursor de paginação

Significados dos status:

- `open`: versões suspeitas, maliciosas, pendentes, em quarentena, revogadas ou denunciadas.
- `blocked`: versões em quarentena, revogadas ou maliciosas.
- `manual`: qualquer versão com uma substituição manual de moderação.
- `all`: qualquer versão com uma substituição manual, estado de análise diferente de limpo ou denúncia do pacote.

Resposta:

```json
{
  "items": [
    {
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Plugin de exemplo",
      "family": "code-plugin",
      "channel": "community",
      "isOfficial": false,
      "version": "1.2.3",
      "createdAt": 1730000000000,
      "artifactKind": "npm-pack",
      "scanStatus": "malicious",
      "moderationState": "quarantined",
      "moderationReason": "análise manual",
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

Denuncia um pacote para análise por moderadores. As denúncias se aplicam ao pacote e podem,
opcionalmente, ser vinculadas a uma versão. Elas alimentam a fila de moderação, mas não ocultam automaticamente nem
bloqueiam downloads por si só; os moderadores devem usar a moderação de versões para
aprovar, colocar em quarentena ou revogar artefatos.

Autenticação:

- Requer um token de API.

Solicitação:

```json
{ "reason": "Binário nativo suspeito", "version": "1.2.3" }
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

Endpoint de moderador/administrador para o recebimento de denúncias de pacotes.

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

Endpoint de proprietário/moderador para visibilidade da moderação de pacotes.

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

Endpoint de moderador/administrador para resolver ou reabrir denúncias de pacotes.

Solicitação:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` é obrigatório para `confirmed` e `dismissed`; pode ser omitido ao
definir `status` novamente como `open`. Passe `finalAction: "quarantine"` ou
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

Solicitação:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Estados compatíveis:

- `approved`: revisada manualmente e permitida.
- `quarantined`: bloqueada enquanto aguarda acompanhamento.
- `revoked`: bloqueada depois que uma versão havia sido considerada confiável anteriormente.

Versões em quarentena e revogadas retornam `403` nas rotas de download de artefatos.
Cada alteração grava uma entrada no log de auditoria.

### `GET /api/v1/packages/{name}/file`

Retorna o conteúdo de texto bruto de um arquivo do pacote.

Parâmetros de consulta:

- `path` (obrigatório)
- `version` (opcional)
- `tag` (opcional)

Observações:

- Usa como padrão a versão mais recente.
- Usa o limite de taxa de leitura, não o de download.
- Arquivos binários retornam `415`.
- Limite de tamanho do arquivo: 200KB.
- Verificações pendentes do VirusTotal não bloqueiam leituras; versões maliciosas ainda podem ser retidas em outros locais.
- Pacotes privados retornam `404`, a menos que o solicitante possa ler o publicador proprietário.

### `GET /api/v1/packages/{name}/download`

Baixa o arquivo ZIP determinístico legado de uma versão do pacote.

Parâmetros de consulta:

- `version` (opcional)
- `tag` (opcional)

Observações:

- Usa como padrão a versão mais recente.
- Skills redirecionam para `GET /api/v1/download`.
- Arquivos de Plugin/pacote são arquivos zip com uma raiz `package/` para que clientes antigos do OpenClaw
  continuem funcionando.
- Esta rota permanece exclusiva para ZIP. Ela não transmite arquivos `.tgz` do ClawPack.
- As respostas incluem os cabeçalhos `ETag`, `Digest`, `X-ClawHub-Artifact-Type` e
  `X-ClawHub-Artifact-Sha256` para verificações de integridade do resolvedor.
- Metadados exclusivos do registro não são inseridos no arquivo baixado.
- Verificações pendentes do VirusTotal não bloqueiam downloads; versões maliciosas retornam `403`.
- Pacotes privados retornam `404`, a menos que o solicitante seja o proprietário.

### `GET /api/npm/{package}`

Retorna um packument compatível com npm para versões de pacotes baseadas no ClawPack.

Observações:

- Somente versões com tarballs npm-pack do ClawPack enviados são listadas.
- Versões legadas disponíveis somente em ZIP são omitidas intencionalmente.
- `dist.tarball`, `dist.integrity` e `dist.shasum` usam campos compatíveis com npm
  para que os usuários possam apontar o npm para o espelho, se desejarem.
- Packuments de pacotes com escopo são compatíveis tanto com `/api/npm/@scope/name` quanto com o caminho de solicitação
  codificado do npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Transmite os bytes exatos do tarball do ClawPack enviado para clientes do espelho npm.

Observações:

- Usa o bucket de taxa de download.
- Os cabeçalhos de download incluem o SHA-256 do ClawHub, além dos metadados de integridade/shasum do npm.
- As verificações de moderação e de acesso a pacotes privados continuam sendo aplicadas.

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

Baixa o ZIP de uma versão hospedada de uma skill ou retorna um redirecionamento para a origem no GitHub de uma
skill atual baseada no GitHub com uma verificação `clean` ou `suspicious` e sem versão
hospedada.

Parâmetros de consulta:

- `slug` (obrigatório)
- `version` (opcional): string semver
- `tag` (opcional): nome da tag (por exemplo, `latest`)

Observações:

- Se nem `version` nem `tag` forem fornecidos, a versão mais recente será usada.
- Versões com exclusão reversível retornam `410`.
- Os redirecionamentos de skills baseadas no GitHub não atuam como proxy nem espelham bytes. A resposta JSON
  inclui `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  e `archiveUrl`; o estado da verificação/atual funciona como uma condição de acesso e não é incluído como metadado
  no payload de sucesso.
- As estatísticas de download são contabilizadas por identidades únicas a cada dia UTC (`userId` quando o token da API é válido; caso contrário, IP).

## Endpoints de autenticação (token Bearer)

Todos os endpoints exigem:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Valida o token e retorna o identificador do usuário.

### `POST /api/v1/skills`

Publica uma nova versão.

- Preferencial: `multipart/form-data` com JSON em `payload` + blobs em `files[]`.
- Também é aceito um corpo JSON com `files` (baseados em storageId).
- Campo opcional do payload: `ownerHandle`. Quando presente, a API resolve esse
  publicador no lado do servidor e exige que o ator tenha acesso de publicação.
- Campo opcional do payload: `migrateOwner`. Quando definido como `true` com `ownerHandle`, uma
  skill existente pode ser transferida para esse proprietário se o ator for administrador/proprietário em ambos
  os publicadores atual e de destino. Sem essa opção explícita, alterações de proprietário são
  rejeitadas.

### `POST /api/v1/packages`

Publica uma versão de um Plugin de código ou Plugin de bundle.

- Requer autenticação por token Bearer.
- Requer `multipart/form-data`.
- Os campos de formulário permitidos são `payload`, blobs `files` repetidos ou uma referência a um tarball
  `clawpack`. `clawpack` pode ser um blob `.tgz` ou um ID de armazenamento retornado pelo
  fluxo de URL de upload. As publicações preparadas com ID de armazenamento também devem incluir o
  `clawpackUploadTicket` retornado com essa URL de upload.
- Use `files` ou `clawpack`, nunca ambos na mesma solicitação.
- Corpos JSON e metadados `payload.files` / `payload.artifact` fornecidos pelo chamador
  são rejeitados.
- Solicitações diretas de publicação multipart são limitadas a 18MB. Tarballs ClawPack podem
  usar o fluxo de URL de upload até o limite de 120MB por tarball.
- Campo opcional do payload: `ownerHandle`. Quando presente, somente administradores podem publicar em nome desse proprietário.

Destaques da validação:

- `family` deve ser `code-plugin` ou `bundle-plugin`.
- Pacotes de Plugin exigem `openclaw.plugin.json`. Uploads `.tgz` do ClawPack devem
  contê-lo em `package/openclaw.plugin.json`.
- Plugins de código exigem `package.json`, metadados do repositório de origem, metadados
  do commit de origem, metadados do esquema de configuração, `openclaw.compat.pluginApi` e
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` e `openclaw.environment` são metadados opcionais.
- Somente o publicador da organização `openclaw` e os publicadores pessoais dos membros atuais
  da organização `openclaw` podem publicar no canal `official`.
- Publicações em nome de terceiros ainda validam a qualificação para o canal oficial em relação à conta do proprietário de destino.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Exclui temporariamente / restaura uma Skill (proprietário, moderador ou administrador).

Corpo JSON opcional:

```json
{ "reason": "Retida para moderação enquanto aguarda análise jurídica." }
```

Quando presente, `reason` é armazenado como a nota de moderação da Skill e copiado para o log de auditoria.
Exclusões temporárias iniciadas pelo proprietário reservam o slug por 30 dias; depois disso, o slug pode ser reivindicado por
outro publicador. A resposta da exclusão inclui `slugReservedUntil` quando esse prazo de expiração se aplica.
Ocultações feitas por moderadores/administradores e remoções por motivos de segurança não expiram dessa forma.

Resposta da exclusão:

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

Somente para administradores. Garante que exista um publicador de organização para um identificador. Se o identificador ainda apontar para um
usuário compartilhado legado/publicador pessoal, o endpoint primeiro o migrará para um publicador de organização.
Para uma organização recém-criada, forneça `memberHandle`; o administrador que executa a ação não é adicionado como membro.
O valor padrão de `memberRole` é `owner`.

- Corpo: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Resposta: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Criação autenticada e autônoma de publicador de organização. Cria um novo publicador de organização e adiciona o
solicitante como proprietário. Este endpoint não migra identificadores existentes de usuários/publicadores pessoais e
não marca o publicador como confiável/oficial.

- Corpo: `{ "handle": "opik", "displayName": "Opik" }`
- Resposta: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Retorna `409` quando o identificador já está sendo usado por um publicador, usuário ou publicador pessoal.

### `POST /api/v1/users/reserve`

Somente para administradores. Reserva slugs raiz e nomes de pacotes para o proprietário legítimo sem publicar uma
versão. Os nomes de pacotes tornam-se pacotes privados de espaço reservado, sem registros de versão, para que o mesmo
proprietário possa publicar posteriormente nesse nome a versão real do Plugin de código ou do Plugin de pacote.

- Corpo: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Resposta: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Somente para administradores. Recupera um publicador pessoal para uma entidade principal substituta verificada do GitHub OAuth
sem editar as linhas de conta do Convex Auth. A solicitação deve indicar os dois IDs imutáveis de conta do provedor GitHub;
os identificadores mutáveis são usados apenas como uma proteção voltada ao operador.

O endpoint usa dry-run por padrão. A aplicação da recuperação exige `dryRun: false` e
`confirmIdentityVerified: true` depois que a equipe verificar de forma independente a continuidade entre ambos os
principais do GitHub. A recuperação falha de forma segura quando o publicador pessoal atual do usuário de destino
tem skills, pacotes ou fontes de skills do GitHub.
A recuperação também migra campos legados `ownerUserId` das skills do publicador recuperado,
aliases de slug de skills, pacotes, avisos do inspetor de pacotes e linhas derivadas do resumo de pesquisa, para que
os caminhos de proprietário direto estejam de acordo com a nova autoridade do publicador. Uma reserva ativa de identificador protegido
para o identificador recuperado também é reatribuída ao usuário substituto, para que uma sincronização posterior
do perfil não possa restaurar a autoridade concorrente do usuário anterior. Cada tabela primária é limitada a
100 linhas por transação de aplicação; recuperações maiores devem primeiro usar uma migração de proprietário retomável.
As fontes de skills do GitHub têm escopo de publicador e são relatadas como verificadas, em vez de reescritas.

- Corpo: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Resposta: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Endpoints de gerenciamento de slug pelo proprietário

- `POST /api/v1/skills/{slug}/rename`
  - Corpo: `{ "newSlug": "new-canonical-slug" }`
  - Resposta: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Corpo: `{ "targetSlug": "canonical-target-slug" }`
  - Resposta: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Observações:

- Ambos os endpoints exigem autenticação por token de API e funcionam somente para o proprietário da skill.
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

Banir um usuário e excluir permanentemente as skills que ele possui (somente moderador/administrador).

Corpo:

```json
{ "handle": "user_handle", "reason": "motivo opcional do banimento" }
```

ou

```json
{ "userId": "users_...", "reason": "motivo opcional do banimento" }
```

Resposta:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

Remover o banimento de um usuário e restaurar as skills qualificadas (somente administrador).

Corpo:

```json
{ "handle": "user_handle", "reason": "motivo opcional para remover o banimento" }
```

ou

```json
{ "userId": "users_...", "reason": "motivo opcional para remover o banimento" }
```

Resposta:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

Alterar o motivo armazenado de um banimento existente sem remover o banimento nem restaurar
o conteúdo (somente administrador). Usa dry-run por padrão, a menos que `dryRun` seja `false`.

Corpo:

```json
{ "handle": "user_handle", "reason": "spam de publicação em massa", "dryRun": true }
```

ou

```json
{ "userId": "users_...", "reason": "spam de publicação em massa", "dryRun": false }
```

Resposta:

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

Alterar a função de um usuário (somente administrador).

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

Listar ou pesquisar usuários (somente administrador).

Parâmetros de consulta:

- `q` (opcional): consulta de pesquisa
- `query` (opcional): alias de `q`
- `limit` (opcional): máximo de resultados (padrão 20, máximo 200)

Resposta:

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

Adicionar/remover uma estrela (destaques). Ambos os endpoints são idempotentes.

Respostas:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Endpoints legados da CLI (descontinuados)

Ainda compatíveis com versões anteriores da CLI:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Consulte `DEPRECATIONS.md` para ver o plano de remoção.

`POST /api/cli/upload-url` retorna `uploadUrl` e `uploadTicket`. Publicações de
pacotes que preparam um tarball ClawPack devem enviar o ID de armazenamento resultante como
`clawpack` e o ticket retornado como `clawpackUploadTicket`.

## Descoberta do registro (`/.well-known/clawhub.json`)

A CLI pode descobrir as configurações de registro/autenticação no site:

- `/.well-known/clawhub.json` (JSON, preferencial)
- `/.well-known/clawdhub.json` (legado)

Esquema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Se você usar hospedagem própria, disponibilize esse arquivo (ou defina `CLAWHUB_REGISTRY` explicitamente; `CLAWDHUB_REGISTRY` é legado).
