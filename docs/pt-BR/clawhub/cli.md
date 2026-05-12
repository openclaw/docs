---
read_when:
    - Usando a CLI do ClawHub
    - Depuração de instalação, atualização, publicação ou sincronização
summary: 'Referência da CLI: comandos, sinalizadores, configuração, arquivo de bloqueio, comportamento de sincronização.'
x-i18n:
    generated_at: "2026-05-12T08:44:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 541fb8367e70fab6aaa9fd622a0c2753170d7cd2afa5e4e02681d606bb45ea8c
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

Pacote CLI: `clawhub`, binário: `clawhub`.

Instale-o globalmente com npm ou pnpm:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Depois verifique:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## Flags globais

- `--workdir <dir>`: diretório de trabalho (padrão: cwd; recorre ao workspace do Clawdbot se configurado)
- `--dir <dir>`: diretório de instalação sob o workdir (padrão: `skills`)
- `--site <url>`: URL base para login no navegador (padrão: `https://clawhub.ai`)
- `--registry <url>`: URL base da API (padrão: descoberta; caso contrário, `https://clawhub.ai`)
- `--no-input`: desabilita prompts

Equivalentes de ambiente:

- `CLAWHUB_SITE` (legado `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (legado `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (legado `CLAWDHUB_WORKDIR`)

### Proxy HTTP

A CLI respeita as variáveis de ambiente padrão de proxy HTTP para sistemas atrás de
proxies corporativos ou redes restritas:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Quando qualquer uma dessas variáveis está definida, a CLI roteia solicitações de saída pelo
proxy especificado. `HTTPS_PROXY` é usado para solicitações HTTPS, `HTTP_PROXY`
para HTTP simples. `NO_PROXY` / `no_proxy` é respeitado para ignorar o proxy para
hosts ou domínios específicos.

Isso é obrigatório em sistemas onde conexões diretas de saída são bloqueadas
(por exemplo, contêineres Docker, VPS Hetzner com internet somente via proxy, firewalls
corporativos).

Exemplo:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Quando nenhuma variável de proxy está definida, o comportamento permanece inalterado (conexões diretas).

## Arquivo de configuração

Armazena seu token de API + URL do registro em cache.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` ou `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Fallback legado: se `clawhub/config.json` ainda não existir, mas `clawdhub/config.json` existir, a CLI reutiliza o caminho legado
- substituição: `CLAWHUB_CONFIG_PATH` (legado `CLAWDHUB_CONFIG_PATH`)

## Comandos

### `login` / `auth login`

- Padrão: abre o navegador em `<site>/cli/auth` e conclui via callback de loopback.
- Headless: `clawhub login --token clh_...`
- Remoto/headless interativo: `clawhub login --device` imprime um código e aguarda enquanto você o autoriza em `<site>/cli/device`.

### `whoami`

- Verifica o token armazenado via `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- Adiciona/remove uma Skill dos seus destaques.
- Chama `POST /api/v1/stars/<slug>` e `DELETE /api/v1/stars/<slug>`.
- `--yes` pula a confirmação.

### `search <query...>`

- Chama `/api/v1/search?q=...`.
- A busca favorece correspondências exatas de tokens de slug/nome antes da popularidade de downloads. Um token de slug independente, como `map`, corresponde a `personal-map` com mais força do que a substring dentro de `amap`.
- Downloads são um pequeno sinal prévio de popularidade, não uma garantia de melhor posicionamento.
- Se uma Skill deveria aparecer, mas não aparece, execute `clawhub inspect <slug>` estando logado para verificar diagnósticos de moderação visíveis ao proprietário antes de renomear metadados.

### `explore`

- Lista as Skills mais recentes via `/api/v1/skills?limit=...&sort=createdAt` (ordenadas por `createdAt` desc).
- Flags:
  - `--limit <n>` (1-200, padrão: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (padrão: newest)
  - `--json` (saída legível por máquina)
- Saída: `<slug>  v<version>  <age>  <summary>` (resumo truncado para 50 caracteres).

### `inspect <slug>`

- Busca metadados da Skill e arquivos de versão sem instalar.
- `--version <version>`: inspeciona uma versão específica (padrão: latest).
- `--tag <tag>`: inspeciona uma versão com tag (por exemplo, `latest`).
- `--versions`: lista o histórico de versões (primeira página).
- `--limit <n>`: máximo de versões a listar (1-200).
- `--files`: lista arquivos para a versão selecionada.
- `--file <path>`: busca conteúdo bruto do arquivo (somente arquivos de texto; limite de 200 KB).
- `--json`: saída legível por máquina.

### `install <slug>`

- Resolve a versão mais recente via `/api/v1/skills/<slug>`.
- Baixa o zip via `/api/v1/download`.
- Extrai para `<workdir>/<dir>/<slug>`.
- Recusa sobrescrever Skills fixadas; execute `clawhub unpin <slug>` primeiro.
- Grava:
  - `<workdir>/.clawhub/lock.json` (legado `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (legado `.clawdhub`)

### `uninstall <slug>`

- Remove `<workdir>/<dir>/<slug>` e exclui a entrada do lockfile.
- Interativo: solicita confirmação.
- Não interativo (`--no-input`): requer `--yes`.

### `list`

- Lê `<workdir>/.clawhub/lock.json` (legado `.clawdhub`).
- Mostra `pinned` ao lado de skills congeladas com `clawhub pin`, incluindo o motivo opcional.

### `pin <slug>`

- Marca uma skill instalada como fixada no lockfile.
- `--reason <text>` registra por que a skill está congelada.
- Skills fixadas são ignoradas por `update --all` e rejeitadas por `update <slug>` direto.
- Skills fixadas também rejeitam `install --force` para que os bytes locais não sejam substituídos acidentalmente.

### `unpin <slug>`

- Remove o pin do lockfile de uma skill instalada para que atualizações futuras possam modificá-la.

### `update [slug]` / `update --all`

- Calcula a fingerprint a partir dos arquivos locais.
- Se a fingerprint corresponder a uma versão conhecida: sem prompt.
- Se a fingerprint não corresponder:
  - recusa por padrão
  - sobrescreve com `--force` (ou prompt, se interativo)
- Skills fixadas nunca são atualizadas por `--force`.
- `update <slug>` falha rapidamente para slugs fixados e informa para executar `clawhub unpin <slug>` primeiro.
- `update --all` ignora slugs fixados e imprime um resumo do que permaneceu congelado.

### `skill publish <path>`

- Publica via `POST /api/v1/skills` (multipart).
- Exige semver: `--version 1.2.3`.
- `--owner <handle>` publica sob um handle de publicador de organização/usuário quando o
  ator tem acesso de publicador.
- `--migrate-owner` move uma skill existente para `--owner` ao publicar uma nova
  versão. Exige acesso de administrador/proprietário em ambos os publicadores.
- O comportamento de proprietário e revisão é explicado em `docs/publishing.md`.
- Publicar uma skill significa que ela é lançada sob `MIT-0` no ClawHub.
- Skills publicadas são livres para usar, modificar e redistribuir sem atribuição.
- O ClawHub não oferece suporte a skills pagas nem a preços por skill.
- `--clawscan-note <text>` adiciona uma nota do ClawScan. Essa nota dá ao ClawScan
  contexto para comportamentos que poderiam parecer incomuns, como acesso à rede,
  acesso ao host nativo ou credenciais específicas de provedor. A nota é armazenada na
  versão publicada.
- Alias legado: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- Exclui uma skill de forma reversível (proprietário, moderador ou administrador).
- Chama `DELETE /api/v1/skills/{slug}`.
- Exclusões reversíveis iniciadas pelo proprietário reservam o slug por 30 dias; o comando imprime o horário de expiração.
- `--reason <text>` registra uma nota de moderação na skill e no log de auditoria.
- `--note <text>` é um alias para `--reason`.
- `--yes` pula a confirmação.

### `undelete <slug>`

- Restaura uma skill oculta (proprietário, moderador ou administrador).
- Chama `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` registra uma nota de moderação na skill e no log de auditoria.
- `--note <text>` é um alias para `--reason`.
- `--yes` pula a confirmação.

### `hide <slug>`

- Oculta uma skill (proprietário, moderador ou administrador).
- Alias para `delete`.

### `unhide <slug>`

- Reexibe uma skill (proprietário, moderador ou administrador).
- Alias para `undelete`.

### `skill rename <slug> <new-slug>`

- Renomeia uma skill própria e mantém o slug anterior como um alias de redirecionamento.
- Chama `POST /api/v1/skills/{slug}/rename`.
- `--yes` pula a confirmação.

### `skill merge <source-slug> <target-slug>`

- Mescla uma skill própria em outra skill própria.
- O slug de origem deixa de ser listado publicamente e se torna um alias de redirecionamento para o destino.
- Chama `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` pula a confirmação.

### `transfer`

- Fluxo de transferência de propriedade.
- Transferências para handles de usuários criam uma solicitação pendente que o destinatário aceita.
- Transferências para handles de organização/publicador são aplicadas imediatamente somente quando o ator tem
  acesso de administrador tanto ao proprietário atual quanto ao publicador de destino.
- Subcomandos:
  - `transfer request <slug> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <slug> [--yes]`
  - `transfer reject <slug> [--yes]`
  - `transfer cancel <slug> [--yes]`
- Endpoints:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Navega ou pesquisa o catálogo unificado de pacotes via `GET /api/v1/packages` e `GET /api/v1/packages/search`.
- Use isto para plugins e outras entradas de famílias de pacotes; `search` no nível superior continua sendo a superfície de busca de skills.
- Flags:
  - `--family skill|code-plugin|bundle-plugin`
  - `--official`
  - `--executes-code`
  - `--target <target>`, `--os <os>`, `--arch <arch>`, `--libc <libc>`
  - `--requires-browser`, `--requires-desktop`, `--requires-native-deps`
  - `--requires-external-service`, `--external-service <name>`
  - `--binary <name>`, `--os-permission <name>`
  - `--artifact-kind legacy-zip|npm-pack`
  - `--npm-mirror`
  - `--limit <n>` (1-100, padrão: 25)
  - `--json`

Exemplos:

```bash
clawhub package explore --family code-plugin
clawhub package explore --family code-plugin --os darwin --requires-desktop
clawhub package explore --family code-plugin --artifact-kind npm-pack
clawhub package explore --npm-mirror
clawhub package explore episodic-claw --family code-plugin
```

### `package inspect <name>`

- Busca metadados do pacote sem instalar.
- Use isto para metadados de Plugin, compatibilidade, verificação, origem e inspeção de versão/arquivo.
- `--version <version>`: inspeciona uma versão específica (padrão: mais recente).
- `--tag <tag>`: inspeciona uma versão marcada (por exemplo, `latest`).
- `--versions`: lista o histórico de versões (primeira página).
- `--limit <n>`: máximo de versões a listar (1-100).
- `--files`: lista os arquivos da versão selecionada.
- `--file <path>`: busca o conteúdo bruto do arquivo (somente arquivos de texto; limite de 200 KB).
- `--json`: saída legível por máquina.

### `package download <name>`

- Resolve uma versão de pacote por meio de
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Baixa o artefato do `downloadUrl` do resolvedor.
- Verifica o SHA-256 do ClawHub para todos os artefatos.
- Para artefatos ClawPack npm-pack, também verifica a integridade npm `sha512`,
  o shasum npm e o nome/versão do `package.json` do tarball.
- Versões ZIP legadas são baixadas pela rota ZIP legada.
- Flags:
  - `--version <version>`: baixa uma versão específica.
  - `--tag <tag>`: baixa uma versão marcada (padrão: `latest`).
  - `-o, --output <path>`: arquivo ou diretório de saída.
  - `--force`: sobrescreve um arquivo de saída existente.
  - `--json`: saída legível por máquina.

Exemplos:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Calcula o SHA-256 do ClawHub, a integridade npm `sha512` e o shasum npm para um
  artefato local.
- Com `--package`, resolve os metadados esperados do ClawHub e compara o
  arquivo local com os metadados do artefato publicado.
- Com flags de digest diretas, verifica sem uma consulta de rede.
- Flags:
  - `--package <name>`: nome do pacote para resolver os metadados esperados do artefato.
  - `--version <version>` ou `--tag <tag>`: versão esperada do pacote.
  - `--sha256 <hex>`: SHA-256 do ClawHub esperado.
  - `--npm-integrity <sri>`: integridade npm esperada.
  - `--npm-shasum <sha1>`: shasum npm esperado.
  - `--json`: saída legível por máquina.

Exemplos:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- Exclui logicamente um pacote e todas as versões.
- Requer o proprietário do pacote, um proprietário/administrador do publicador da organização, moderador da plataforma
  ou administrador da plataforma.
- Flags:
  - `--yes`: pula a confirmação.
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- Restaura um pacote excluído logicamente e suas versões.
- Requer o proprietário do pacote, um proprietário/administrador do publicador da organização, moderador da plataforma
  ou administrador da plataforma.
- Chama `POST /api/v1/packages/{name}/undelete`.
- Flags:
  - `--yes`: pula a confirmação.
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Transfere um pacote para outro publicador.
- Requer acesso de administrador tanto ao proprietário atual do pacote quanto ao publicador de destino,
  a menos que seja executado por um administrador da plataforma.
- Nomes de pacote com escopo devem ser transferidos para o proprietário do escopo correspondente.
- Chama `POST /api/v1/packages/{name}/transfer`.
- Flags:
  - `--to <owner>`: handle do publicador de destino.
  - `--reason <text>`: motivo opcional de auditoria.
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Comando autenticado para denunciar um pacote aos moderadores.
- Chama `POST /api/v1/packages/{name}/report`.
- As denúncias são no nível do pacote, opcionalmente vinculadas a uma versão, e ficam visíveis
  para revisão pelos moderadores.
- As denúncias não ocultam pacotes automaticamente nem bloqueiam downloads por si só.
- Flags:
  - `--version <version>`: versão opcional do pacote a anexar à denúncia.
  - `--reason <text>`: motivo obrigatório da denúncia.
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Comando do proprietário para verificar a visibilidade de moderação do pacote.
- Chama `GET /api/v1/packages/{name}/moderation`.
- Mostra o estado atual de varredura do pacote, a contagem de denúncias abertas, o estado de moderação manual
  da versão mais recente, o estado de bloqueio de downloads e os motivos de moderação.
- Flags:
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Verifica se um pacote está pronto para consumo futuro pelo OpenClaw.
- Chama `GET /api/v1/packages/{name}/readiness`.
- Relata bloqueadores para status oficial, disponibilidade do ClawPack, digest do artefato,
  procedência do código-fonte, compatibilidade com OpenClaw, destinos de host, metadados de ambiente
  e estado de varredura.
- Flags:
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Mostra o status de migração voltado para operadores de um pacote que pode substituir um
  plugin incluído no OpenClaw.
- Chama o mesmo endpoint de prontidão computada que `package readiness`, mas imprime
  status focado em migração, versão mais recente, estado de pacote oficial, verificações e
  bloqueadores.
- Flags:
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- Publica um plugin de código ou plugin de pacote via `POST /api/v1/packages`.
- `<source>` aceita:
  - Caminho de pasta local: `./my-plugin`
  - Tarball local do ClawPack npm-pack: `./my-plugin-1.2.3.tgz`
  - Repositório GitHub: `owner/repo` ou `owner/repo@ref`
  - URL do GitHub: `https://github.com/owner/repo`
- Os metadados são detectados automaticamente a partir de `package.json`, `openclaw.plugin.json` e
  marcadores reais de pacote OpenClaw, como `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` e `.cursor-plugin/plugin.json`.
- Fontes `.tgz` são tratadas como ClawPack. A CLI envia os bytes exatos do npm-pack
  e usa o conteúdo `package/` extraído apenas para validação e preenchimento prévio
  de metadados.
- Pastas de plugin de código são empacotadas em um tarball npm do ClawPack antes do envio para que
  instalações do OpenClaw possam verificar o artefato exato. Pastas de plugin de pacote ainda
  usam o caminho de publicação por arquivos extraídos.
- Para fontes do GitHub, a atribuição de fonte é preenchida automaticamente a partir do repositório, commit resolvido, ref e subcaminho.
- Para pastas locais, a atribuição de fonte é detectada automaticamente a partir do git local quando o remoto origin aponta para o GitHub.
- Plugins de código externos devem declarar `openclaw.compat.pluginApi` e
  `openclaw.build.openclawVersion` explicitamente.
  `package.json.version` de nível superior não é usado como fallback para validação de publicação.
- `--dry-run` pré-visualiza o payload de publicação resolvido sem enviar.
- `--json` emite saída legível por máquina para CI.
- `--owner <handle>` publica sob um handle de publicador de usuário ou organização quando o ator tem acesso de publicador.
- `--clawscan-note <text>` adiciona uma observação do ClawScan. Essa observação dá ao ClawScan
  contexto para comportamentos que poderiam parecer incomuns, como acesso à rede,
  acesso ao host nativo ou credenciais específicas de provedor. A observação é armazenada
  na versão publicada.
- Nomes de pacote com escopo devem corresponder ao proprietário selecionado. Consulte `docs/publishing.md`.
- Flags existentes (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) ainda funcionam como substituições.
- Repositórios privados do GitHub exigem `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### Fluxo local recomendado

Use `--dry-run` primeiro para poder confirmar os metadados resolvidos do pacote e
a atribuição de fonte antes de criar uma versão real:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Fluxo de pasta local

Para plugins de código, a publicação de pasta cria e envia um artefato ClawPack a partir
da pasta do pacote:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` mínimo para `--family code-plugin`

Plugins de código externos precisam de uma pequena quantidade de metadados do OpenClaw em
`package.json`. Este manifesto mínimo é suficiente para uma publicação bem-sucedida:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2"
    }
  }
}
```

Campos obrigatórios:

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

Observações:

- `package.json.version` é a versão de lançamento do seu pacote, mas não é usada como
  fallback para validação de compatibilidade/build do OpenClaw.
- `openclaw.hostTargets` e `openclaw.environment` são metadados opcionais.
  O ClawHub pode exibi-los quando presentes, mas eles não são obrigatórios para publicação.
- `openclaw.compat.minGatewayVersion` e
  `openclaw.build.pluginSdkVersion` são extras opcionais se você quiser publicar
  metadados de compatibilidade mais detalhados.
- Se você estiver usando uma versão mais antiga da CLI `clawhub`, atualize antes de publicar para que
  as verificações locais de preflight sejam executadas antes do envio.

#### GitHub Actions

O ClawHub também fornece um workflow reutilizável oficial em
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/be77f0626d9e4b52c465670ba411882be1ac3a2d/.github/workflows/package-publish.yml)
para repositórios de plugins.

Configuração típica do chamador:

```yaml
name: Package Publish

on:
  pull_request:
  workflow_dispatch:
  push:
    tags:
      - "v*"

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch' || startsWith(github.ref, 'refs/tags/')
    permissions:
      contents: read
      id-token: write
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Observações:

- O workflow reutilizável define `source` como padrão para o repositório chamador.
- Para monorepos, passe `source_path` para que o workflow publique a pasta do pacote
  de plugin, por exemplo `source_path: extensions/codex`.
- Fixe o workflow reutilizável a uma tag estável ou ao SHA completo de um commit. Não execute publicação de versão a partir de `@main`.
- `pull_request` deve usar `dry_run: true` para que a CI permaneça sem poluição.
- Publicações reais devem ser limitadas a eventos confiáveis, como `workflow_dispatch` ou push de tags.
- Publicação confiável sem segredo só funciona em `workflow_dispatch`; push de tags ainda precisa de `clawhub_token`.
- Mantenha `clawhub_token` disponível para a primeira publicação, pacotes não confiáveis ou publicações de emergência.
- O workflow envia o resultado JSON como artefato e o expõe como saídas do workflow.

### `sync`

- Varre pastas locais de Skills e publica as novas/alteradas.
- Raízes podem ser qualquer pasta: um diretório de Skills ou uma única pasta de Skill com `SKILL.md`.
- Adiciona automaticamente raízes de Skills do Clawdbot quando `~/.clawdbot/clawdbot.json` está presente:
  - `agent.workspace/skills` (agente principal)
  - `routing.agents.*.workspace/skills` (por agente)
  - `~/.clawdbot/skills` (compartilhado)
  - `skills.load.extraDirs` (pacotes compartilhados)
- Respeita `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` e `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`.
- Flags:
  - `--root <dir...>` raízes extras de varredura
  - `--all` envia sem solicitar confirmação
  - `--dry-run` mostra apenas o plano
  - `--bump patch|minor|major` (padrão: patch)
  - `--changelog <text>` (não interativo)
  - `--tags a,b,c` (padrão: latest)
  - `--concurrency <n>` (padrão: 4)

Telemetria:

- Enviada durante `sync` quando conectado, a menos que `CLAWHUB_DISABLE_TELEMETRY=1` (legado `CLAWDHUB_DISABLE_TELEMETRY=1`).
- Detalhes: `docs/telemetry.md`.
