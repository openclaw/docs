---
read_when:
    - Usando a CLI do ClawHub
    - Depuração de instalação, atualização, publicação ou sincronização
summary: 'Referência da CLI: comandos, flags, configuração, lockfile, comportamento de sincronização.'
x-i18n:
    generated_at: "2026-05-13T05:32:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 33d1874fbb65602a7a3b19838a45b4715fa1edd4edc8873a3e4b53bd122e6774
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

Pacote da CLI: `clawhub`, binário: `clawhub`.

Instale globalmente com npm ou pnpm:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Depois, verifique:

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
- `--no-input`: desativa prompts

Equivalentes de ambiente:

- `CLAWHUB_SITE` (legado `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (legado `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (legado `CLAWDHUB_WORKDIR`)

### Proxy HTTP

A CLI respeita variáveis de ambiente padrão de proxy HTTP para sistemas atrás de
proxies corporativos ou redes restritas:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Quando qualquer uma dessas variáveis está definida, a CLI roteia solicitações de saída pelo
proxy especificado. `HTTPS_PROXY` é usado para solicitações HTTPS, `HTTP_PROXY`
para HTTP simples. `NO_PROXY` / `no_proxy` é respeitado para ignorar o proxy em
hosts ou domínios específicos.

Isso é obrigatório em sistemas nos quais conexões diretas de saída são bloqueadas
(por exemplo, contêineres Docker, VPS Hetzner com internet somente via proxy, firewalls
corporativos).

Exemplo:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Quando nenhuma variável de proxy está definida, o comportamento não muda (conexões diretas).

## Arquivo de configuração

Armazena seu token de API + URL de registro em cache.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` ou `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Fallback legado: se `clawhub/config.json` ainda não existir, mas `clawdhub/config.json` existir, a CLI reutiliza o caminho legado
- substituição: `CLAWHUB_CONFIG_PATH` (legado `CLAWDHUB_CONFIG_PATH`)

## Comandos

### `login` / `auth login`

- Padrão: abre o navegador em `<site>/cli/auth` e conclui via callback de loopback.
- Headless: `clawhub login --token clh_...`
- Interativo remoto/headless: `clawhub login --device` imprime um código e aguarda enquanto você o autoriza em `<site>/cli/device`.

### `whoami`

- Verifica o token armazenado via `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- Adiciona/remove uma skill dos seus destaques.
- Chama `POST /api/v1/stars/<slug>` e `DELETE /api/v1/stars/<slug>`.
- `--yes` pula a confirmação.

### `search <query...>`

- Chama `/api/v1/search?q=...`.
- A busca prioriza correspondências exatas de tokens de slug/nome antes da popularidade de downloads. Um token de slug isolado, como `map`, corresponde a `personal-map` com mais força do que à substring dentro de `amap`.
- Downloads são um pequeno sinal prévio de popularidade, não uma garantia de posicionamento no topo.
- Se uma skill deveria aparecer, mas não aparece, execute `clawhub inspect <slug>` com login feito para verificar diagnósticos de moderação visíveis ao proprietário antes de renomear metadados.

### `explore`

- Lista as skills mais novas via `/api/v1/skills?limit=...&sort=createdAt` (ordenadas por `createdAt` desc).
- Flags:
  - `--limit <n>` (1-200, padrão: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (padrão: newest)
  - `--json` (saída legível por máquina)
- Saída: `<slug>  v<version>  <age>  <summary>` (resumo truncado em 50 caracteres).

### `inspect <slug>`

- Busca metadados da skill e arquivos da versão sem instalar.
- `--version <version>`: inspeciona uma versão específica (padrão: latest).
- `--tag <tag>`: inspeciona uma versão marcada (por exemplo, `latest`).
- `--versions`: lista o histórico de versões (primeira página).
- `--limit <n>`: máximo de versões a listar (1-200).
- `--files`: lista arquivos da versão selecionada.
- `--file <path>`: busca o conteúdo bruto do arquivo (somente arquivos de texto; limite de 200KB).
- `--json`: saída legível por máquina.

### `install <slug>`

- Resolve a versão mais recente via `/api/v1/skills/<slug>`.
- Baixa o zip via `/api/v1/download`.
- Extrai em `<workdir>/<dir>/<slug>`.
- Recusa sobrescrever skills fixadas; execute `clawhub unpin <slug>` primeiro.
- Grava:
  - `<workdir>/.clawhub/lock.json` (legado `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (legado `.clawdhub`)

### `uninstall <slug>`

- Remove `<workdir>/<dir>/<slug>` e exclui a entrada do lockfile.
- Interativo: solicita confirmação.
- Não interativo (`--no-input`): exige `--yes`.

### `list`

- Lê `<workdir>/.clawhub/lock.json` (legado `.clawdhub`).
- Mostra `pinned` ao lado de skills congeladas com `clawhub pin`, incluindo o motivo opcional.

### `pin <slug>`

- Marca uma skill instalada como fixada no lockfile.
- `--reason <text>` registra por que a skill está congelada.
- Skills fixadas são ignoradas por `update --all` e rejeitadas por `update <slug>` direto.
- Skills fixadas também rejeitam `install --force` para que os bytes locais não possam ser substituídos acidentalmente.

### `unpin <slug>`

- Remove a fixação do lockfile de uma skill instalada para que atualizações futuras possam modificá-la.

### `update [slug]` / `update --all`

- Calcula a impressão digital a partir dos arquivos locais.
- Se a impressão digital corresponder a uma versão conhecida: nenhum prompt.
- Se a impressão digital não corresponder:
  - recusa por padrão
  - sobrescreve com `--force` (ou prompt, se interativo)
- Skills fixadas nunca são atualizadas por `--force`.
- `update <slug>` falha rapidamente para slugs fixados e informa que você deve executar `clawhub unpin <slug>` primeiro.
- `update --all` ignora slugs fixados e imprime um resumo do que permaneceu congelado.

### `skill publish <path>`

- Publica via `POST /api/v1/skills` (multipart).
- Exige semver: `--version 1.2.3`.
- `--owner <handle>` publica sob um identificador de publicador de organização/usuário quando o
  ator tem acesso de publicador.
- `--migrate-owner` move uma skill existente para `--owner` ao publicar uma nova
  versão. Exige acesso de admin/proprietário em ambos os publicadores.
- O comportamento de proprietário e revisão é explicado em `docs/publishing.md`.
- Publicar uma skill significa que ela é lançada sob `MIT-0` no ClawHub.
- Skills publicadas são livres para usar, modificar e redistribuir sem atribuição.
- O ClawHub não oferece suporte a skills pagas nem a precificação por skill.
- `--clawscan-note <text>` adiciona uma nota do ClawScan. Essa nota dá ao ClawScan
  contexto para comportamentos que poderiam parecer incomuns, como acesso à rede,
  acesso ao host nativo ou credenciais específicas de provedor. A nota é armazenada na
  versão publicada.
- Alias legado: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- Exclui temporariamente uma skill (proprietário, moderador ou admin).
- Chama `DELETE /api/v1/skills/{slug}`.
- Exclusões temporárias iniciadas pelo proprietário reservam o slug por 30 dias; o comando imprime o horário de expiração.
- `--reason <text>` registra uma nota de moderação na skill e no log de auditoria.
- `--note <text>` é um alias para `--reason`.
- `--yes` pula a confirmação.

### `undelete <slug>`

- Restaura uma skill oculta (proprietário, moderador ou admin).
- Chama `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` registra uma nota de moderação na skill e no log de auditoria.
- `--note <text>` é um alias para `--reason`.
- `--yes` pula a confirmação.

### `hide <slug>`

- Oculta uma skill (proprietário, moderador ou admin).
- Alias para `delete`.

### `unhide <slug>`

- Reexibe uma skill (proprietário, moderador ou admin).
- Alias para `undelete`.

### `skill rename <slug> <new-slug>`

- Renomeia uma skill própria e mantém o slug anterior como alias de redirecionamento.
- Chama `POST /api/v1/skills/{slug}/rename`.
- `--yes` pula a confirmação.

### `skill merge <source-slug> <target-slug>`

- Mescla uma skill própria em outra skill própria.
- O slug de origem deixa de ser listado publicamente e se torna um alias de redirecionamento para o destino.
- Chama `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` pula a confirmação.

### `transfer`

- Fluxo de trabalho de transferência de propriedade.
- Transferências para identificadores de usuário criam uma solicitação pendente que o destinatário aceita.
- Transferências para identificadores de org/publicador são aplicadas imediatamente somente quando o ator tem
  acesso de admin tanto ao proprietário atual quanto ao publicador de destino.
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

- Navega ou pesquisa no catálogo unificado de pacotes via `GET /api/v1/packages` e `GET /api/v1/packages/search`.
- Use isto para plugins e outras entradas da família de pacotes; `search` de nível superior continua sendo a superfície de busca de skills.
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
- Use isto para metadados de plugin, compatibilidade, verificação, origem e inspeção de versão/arquivo.
- `--version <version>`: inspeciona uma versão específica (padrão: mais recente).
- `--tag <tag>`: inspeciona uma versão com tag (por exemplo, `latest`).
- `--versions`: lista o histórico de versões (primeira página).
- `--limit <n>`: máximo de versões a listar (1-100).
- `--files`: lista arquivos da versão selecionada.
- `--file <path>`: busca o conteúdo bruto do arquivo (somente arquivos de texto; limite de 200 KB).
- `--json`: saída legível por máquina.

### `package download <name>`

- Resolve uma versão de pacote por meio de
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Baixa o artefato do `downloadUrl` do resolvedor.
- Verifica o SHA-256 do ClawHub para todos os artefatos.
- Para artefatos ClawPack npm-pack, também verifica a integridade npm `sha512`,
  o shasum npm e o nome/versão no `package.json` do tarball.
- Versões ZIP legadas são baixadas pela rota ZIP legada.
- Flags:
  - `--version <version>`: baixa uma versão específica.
  - `--tag <tag>`: baixa uma versão com tag (padrão: `latest`).
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
- Com flags diretas de digest, verifica sem uma consulta de rede.
- Flags:
  - `--package <name>`: nome do pacote para resolver os metadados esperados do artefato.
  - `--version <version>` ou `--tag <tag>`: versão esperada do pacote.
  - `--sha256 <hex>`: SHA-256 esperado do ClawHub.
  - `--npm-integrity <sri>`: integridade npm esperada.
  - `--npm-shasum <sha1>`: shasum npm esperado.
  - `--json`: saída legível por máquina.

Exemplos:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- Exclui temporariamente um pacote e todas as versões.
- Requer o proprietário do pacote, um proprietário/admin de publicador de org, moderador da plataforma
  ou admin da plataforma.
- Opções:
  - `--yes`: pula a confirmação.
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- Restaura um pacote excluído temporariamente e suas versões.
- Requer o proprietário do pacote, um proprietário/admin de publicador de org, moderador da plataforma
  ou admin da plataforma.
- Chama `POST /api/v1/packages/{name}/undelete`.
- Opções:
  - `--yes`: pula a confirmação.
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Transfere um pacote para outro publicador.
- Requer acesso de admin ao proprietário atual do pacote e ao publicador de
  destino, a menos que seja executado por um admin da plataforma.
- Nomes de pacotes com escopo devem ser transferidos para o proprietário do escopo correspondente.
- Chama `POST /api/v1/packages/{name}/transfer`.
- Opções:
  - `--to <owner>`: identificador do publicador de destino.
  - `--reason <text>`: motivo opcional para auditoria.
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
- Opções:
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
  da versão mais recente, o estado de bloqueio de download e os motivos de moderação.
- Opções:
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Verifica se um pacote está pronto para consumo futuro pelo OpenClaw.
- Chama `GET /api/v1/packages/{name}/readiness`.
- Relata bloqueadores de status oficial, disponibilidade do ClawPack, digest do artefato,
  proveniência do código-fonte, compatibilidade com OpenClaw, destinos de host, metadados de ambiente
  e estado de varredura.
- Opções:
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Mostra o status de migração voltado ao operador para um pacote que pode substituir um
  Plugin do OpenClaw incluído no bundle.
- Chama o mesmo endpoint de prontidão calculada que `package readiness`, mas imprime
  status focado em migração, versão mais recente, estado de pacote oficial, verificações e
  bloqueadores.
- Opções:
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- Publica um Plugin de código ou Plugin de bundle via `POST /api/v1/packages`.
- `<source>` aceita:
  - Caminho de pasta local: `./my-plugin`
  - Tarball npm-pack local do ClawPack: `./my-plugin-1.2.3.tgz`
  - Repositório do GitHub: `owner/repo` ou `owner/repo@ref`
  - URL do GitHub: `https://github.com/owner/repo`
- Os metadados são detectados automaticamente a partir de `package.json`, `openclaw.plugin.json` e
  marcadores reais de bundle do OpenClaw, como `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` e `.cursor-plugin/plugin.json`.
- Fontes `.tgz` são tratadas como ClawPack. A CLI envia os bytes exatos do npm-pack
  e usa o conteúdo extraído de `package/` apenas para validação e preenchimento prévio
  de metadados.
- Pastas de Plugin de código são empacotadas em um tarball npm do ClawPack antes do upload para que
  instalações do OpenClaw possam verificar o artefato exato. Pastas de Plugin de bundle ainda
  usam o caminho de publicação por arquivos extraídos.
- Para fontes do GitHub, a atribuição de origem é preenchida automaticamente a partir do repositório, commit resolvido, ref e subcaminho.
- Para pastas locais, a atribuição de origem é detectada automaticamente pelo git local quando o remote de origem aponta para o GitHub.
- Plugins de código externos devem declarar `openclaw.compat.pluginApi` e
  `openclaw.build.openclawVersion` explicitamente.
  `package.json.version` no nível superior não é usado como fallback para validação de publicação.
- `--dry-run` pré-visualiza o payload de publicação resolvido sem enviar.
- `--json` emite saída legível por máquina para CI.
- `--owner <handle>` publica sob um identificador de publicador de usuário ou org quando o ator tem acesso de publicador.
- `--clawscan-note <text>` adiciona uma nota do ClawScan. Essa nota dá ao ClawScan
  contexto para comportamento que, de outra forma, poderia parecer incomum, como acesso à rede,
  acesso a host nativo ou credenciais específicas de provedor. A nota é armazenada na
  versão publicada.
- Nomes de pacotes com escopo devem corresponder ao proprietário selecionado. Consulte `docs/publishing.md`.
- Flags existentes (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) ainda funcionam como sobrescritas.
- Repositórios privados do GitHub exigem `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### Fluxo local recomendado

Use `--dry-run` primeiro para confirmar os metadados do pacote resolvidos e
a atribuição de origem antes de criar uma versão ativa:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Fluxo de pasta local

Para Plugins de código, a publicação de pasta cria e envia um artefato ClawPack a partir
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
- Se estiver usando uma versão mais antiga da CLI `clawhub`, atualize antes de publicar para que
  as verificações locais de preflight sejam executadas antes do upload.

#### GitHub Actions

O ClawHub também fornece um workflow reutilizável oficial em
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/2ddaad62cc7852eb8274022ae8a6d7527d169ae8/.github/workflows/package-publish.yml)
para repositórios de Plugin.

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

- O workflow reutilizável define `source` por padrão como o repositório chamador.
- Para monorepos, passe `source_path` para que o workflow publique a pasta do pacote
  Plugin, por exemplo `source_path: extensions/codex`.
- Fixe o workflow reutilizável em uma tag estável ou SHA de commit completo. Não execute publicação de release a partir de `@main`.
- `pull_request` deve usar `dry_run: true` para que a CI permaneça sem poluição.
- Publicações reais devem se limitar a eventos confiáveis, como `workflow_dispatch` ou pushes de tags.
- Publicação confiável sem um segredo funciona apenas em `workflow_dispatch`; pushes de tags ainda precisam de `clawhub_token`.
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
- Opções:
  - `--root <dir...>` raízes de varredura extras
  - `--all` enviar sem perguntar
  - `--dry-run` mostrar apenas o plano
  - `--bump patch|minor|major` (padrão: patch)
  - `--changelog <text>` (não interativo)
  - `--tags a,b,c` (padrão: latest)
  - `--concurrency <n>` (padrão: 4)

Telemetria:

- Enviada durante `sync` quando conectado, a menos que `CLAWHUB_DISABLE_TELEMETRY=1` (legado `CLAWDHUB_DISABLE_TELEMETRY=1`).
- Detalhes: `docs/telemetry.md`.
