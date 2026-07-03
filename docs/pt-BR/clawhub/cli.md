---
read_when:
    - Usando a CLI do ClawHub
    - Depuração de instalação, atualização ou publicação
summary: 'Referência da CLI: comandos, flags, configuração e comportamento do arquivo de lock.'
x-i18n:
    generated_at: "2026-07-03T15:20:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23065775d74e7b52ed250051b8724b780c28dfdfc0adf9b8f115f7133fbdd77b
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

Depois verifique:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## Flags globais

- `--workdir <dir>`: diretório de trabalho (padrão: cwd; recorre ao workspace do Clawdbot se configurado)
- `--dir <dir>`: diretório de instalação em workdir (padrão: `skills`)
- `--site <url>`: URL base para login no navegador (padrão: `https://clawhub.ai`)
- `--registry <url>`: URL base da API (padrão: descoberta; caso contrário, `https://clawhub.ai`)
- `--no-input`: desabilita prompts

Equivalentes de env:

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
para HTTP simples. `NO_PROXY` / `no_proxy` é respeitado para ignorar o proxy para
hosts ou domínios específicos.

Isso é necessário em sistemas onde conexões diretas de saída são bloqueadas
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

### `token`

- Imprime o token de API armazenado em stdout.
- Útil para encaminhar um token de login local para comandos de configuração de segredo de CI.

### `star <skill>` / `unstar <skill>`

- Adiciona/remove uma skill dos seus destaques.
- Chama `POST /api/v1/stars/<slug>` e `DELETE /api/v1/stars/<slug>`.
- `--yes` pula a confirmação.

### `search <query...>`

- Chama `/api/v1/search?q=...`.
- A saída inclui o slug da skill, handle do proprietário, nome de exibição e pontuação de relevância.
- A busca favorece correspondências exatas de token de slug/nome antes da popularidade de downloads. Um token de slug independente como `map` corresponde a `personal-map` mais fortemente do que à substring dentro de `amap`.
- Popularidade é um pequeno prior de ranqueamento, não uma garantia de posição superior.
- Se uma skill deveria aparecer, mas não aparece, execute `clawhub inspect @owner/slug` enquanto estiver logado para verificar diagnósticos de moderação visíveis ao proprietário antes de renomear metadados.

### `explore`

- Lista as skills mais novas via `/api/v1/skills?limit=...&sort=createdAt` (ordenadas por `createdAt` desc).
- Flags:
  - `--limit <n>` (1-200, padrão: 25)
  - `--sort newest|updated|rating|downloads|trending` (padrão: newest). Aliases legados de ordenação de instalação ainda funcionam por compatibilidade.
  - `--json` (saída legível por máquina)
- Saída: `<slug>  v<version>  <age>  <summary>` (resumo truncado para 50 caracteres).

### `inspect @owner/slug`

- Busca metadados da skill e arquivos de versão sem instalar.
- `--version <version>`: inspeciona uma versão específica (padrão: mais recente).
- `--tag <tag>`: inspeciona uma versão marcada (por exemplo, `latest`).
- `--versions`: lista o histórico de versões (primeira página).
- `--limit <n>`: máximo de versões a listar (1-200).
- `--files`: lista arquivos da versão selecionada.
- `--file <path>`: busca conteúdo bruto de arquivo (somente arquivos de texto; limite de 200 KB).
- `--json`: saída legível por máquina.

### `install @owner/slug`

- Resolve a versão mais recente para o proprietário e a skill nomeados.
- Baixa zip via `/api/v1/download`.
- Extrai para `<workdir>/<dir>/<slug>`.
- Recusa sobrescrever skills fixadas; execute `clawhub unpin <skill>` primeiro.
- Grava:
  - `<workdir>/.clawhub/lock.json` (legado `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (legado `.clawdhub`)

### `uninstall <skill>`

- Remove `<workdir>/<dir>/<slug>` e exclui a entrada do lockfile.
- Envia telemetria em best-effort enquanto estiver logado para que as contagens de instalação atuais possam ser
  desativadas.
- Interativo: pede confirmação.
- Não interativo (`--no-input`): requer `--yes`.

### `list`

- Lê `<workdir>/.clawhub/lock.json` (legado `.clawdhub`).
- Mostra `pinned` ao lado de skills congeladas com `clawhub pin`, incluindo o motivo opcional.

### `pin <skill>`

- Marca uma skill instalada como fixada no lockfile.
- `--reason <text>` registra por que a skill está congelada.
- Skills fixadas são ignoradas por `update --all` e rejeitadas por `update <skill>` direto.
- Skills fixadas também rejeitam `install --force` para que os bytes locais não sejam substituídos acidentalmente.

### `unpin <skill>`

- Remove a fixação do lockfile de uma skill instalada para que atualizações futuras possam modificá-la.

### `update [@owner/slug]` / `update --all`

- Calcula a impressão digital a partir de arquivos locais.
- Se a impressão digital corresponder a uma versão conhecida: sem prompt.
- Se a impressão digital não corresponder:
  - recusa por padrão
  - sobrescreve com `--force` (ou prompt, se interativo)
- Skills fixadas nunca são atualizadas por `--force`.
- `update <skill>` falha rapidamente para skills fixadas e orienta você a executar `clawhub unpin <skill>` primeiro.
- `update --all` ignora slugs fixados e imprime um resumo do que permaneceu congelado.

### `skill publish <path>`

- Compara a impressão digital do pacote local com o ClawHub e sai com sucesso quando
  o conteúdo já está publicado.
- Novas skills usam `1.0.0` por padrão; skills alteradas usam a próxima versão
  patch por padrão.
- `--version <version>` seleciona explicitamente uma versão e publica mesmo quando o
  conteúdo corresponde a uma versão existente.
- `--dry-run` resolve a publicação sem fazer upload; `--json` imprime um
  resultado legível por máquina.
- `--owner <handle>` publica sob um handle de publicador de org/usuário quando o
  ator tem acesso de publicador.
- `--migrate-owner` move uma skill existente para `--owner` enquanto publica uma nova
  versão. Requer acesso de admin/proprietário em ambos os publicadores.
- O comportamento de proprietário e revisão é explicado em `docs/publishing.md`.
- Publicar uma skill significa que ela é lançada sob `MIT-0` no ClawHub.
- Skills publicadas são livres para usar, modificar e redistribuir sem atribuição.
- O ClawHub não oferece suporte a skills pagas nem precificação por skill.
- Alias legado: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

O workflow reutilizável
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
do ClawHub chama `skill publish` para um `skill_path`, ou para cada pasta de skill imediata
em `root` (padrão: `skills`). Ele ignora skills inalteradas e usa o
mesmo comportamento automático de versão patch.

Defina `dry_run: true` para pré-visualizar sem um token. Publicações reais exigem o
segredo `clawhub_token`.

### `sync`

- Varre o workdir atual, o diretório de skills configurado e quaisquer
  pastas `--root <dir>` em busca de pastas de skill locais contendo `SKILL.md` ou
  `skill.md`.
- Compara cada impressão digital de skill local com o ClawHub e publica somente skills novas ou
  alteradas.
- Novas skills são publicadas como `1.0.0`; skills alteradas publicam a próxima versão patch
  por padrão. Use `--bump minor|major` para lotes de atualização que devem avançar em um
  passo semver maior.
- `--dry-run` mostra o plano de publicação sem fazer upload; `--json` imprime um
  plano legível por máquina.
- `--all` publica toda skill nova ou alterada sem perguntar. Sem
  `--all`, terminais interativos permitem selecionar as skills a publicar.
- `--owner <handle>` publica sob um handle de publicador de org/usuário quando o
  ator tem acesso de publicador.
- `sync` é somente publicação unidirecional. Ele não instala, atualiza, baixa nem
  relata telemetria de instalação/download.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Requer `clawhub login`.
- Executa o ClawScan do ClawHub por meio de `POST /api/v1/skills/-/scan` e depois consulta até que a varredura seja terminal.
- Varreduras são assíncronas e podem levar tempo para concluir. Enquanto estiver na fila, o spinner do terminal mostra a posição atual priorizada da varredura e quantas varreduras estão à frente.
- Varreduras publicadas exigem propriedade ou acesso de gerenciamento de publicador. Moderadores/admins podem usar o mesmo backend por meio de `clawhub-admin`.
- `--update` é válido somente com `--slug`; ele grava resultados bem-sucedidos de varredura publicada de volta na versão selecionada.
- `--output <file.zip>` baixa o arquivo completo do relatório com `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` e `README.md`.
- `--json` imprime a resposta completa de consulta para automação.
- Varreduras de caminho local não são mais suportadas. Faça upload de uma nova versão e depois use `scan download` para recuperar os resultados de varredura armazenados para essa versão enviada.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Requer `clawhub login`.
- Baixa o ZIP do relatório de varredura armazenado para uma versão enviada de skill ou plugin, incluindo versões que foram bloqueadas ou ocultadas por verificações de segurança do ClawHub.
- Downloads de skill usam o slug da skill e usam `--kind skill` por padrão.
- Downloads de plugin usam o nome do pacote e exigem `--kind plugin`.
- `--version` é obrigatório para que autores inspecionem a versão exata enviada que o ClawHub bloqueou.
- `--output <file.zip>` escolhe o caminho de destino.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

O ClawHub fornece um workflow reutilizável oficial em
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/76b4f36bb0f7409ed7cb9c6fd6f1ccf81396ee88/.github/workflows/skill-publish.yml)
para repositórios de skill e repositórios de catálogo.

Configuração típica de catálogo:

```yaml
name: Skill Publish

on:
  pull_request:
  workflow_dispatch:

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Observações:

- `root` usa `skills` como padrão para repositórios de catálogo.
- Passe `skill_path: skills/review-helper` para processar uma pasta de skill.
- `owner` mapeia para a flag `--owner` da CLI; omita para publicar como o usuário autenticado.
- A publicação de skills V1 usa `clawhub_token`; publicação confiável por GitHub OIDC é somente para pacotes por enquanto.

### `delete <skill>`

- Sem `--version`, exclui temporariamente uma skill (proprietário, moderador ou administrador).
- Chama `DELETE /api/v1/skills/{slug}`.
- Exclusões temporárias iniciadas pelo proprietário reservam o slug por 30 dias; o comando imprime o horário de expiração.
- `--version <version>` exclui permanentemente uma versão própria não mais recente por meio de uma rota fail-closed
  específica da versão.
  Versões excluídas não podem ser restauradas nem republicadas. Publique uma substituição antes de excluir a
  versão mais recente atual. A equipe da plataforma não ignora a propriedade para este fluxo apenas de versão.
- `--reason <text>` registra uma nota de moderação em uma exclusão temporária da skill inteira e no log de auditoria.
- `--note <text>` é um alias para `--reason`.
- `--yes` pula a confirmação.

### `undelete <skill>`

- Restaura uma skill oculta (proprietário, moderador ou administrador).
- Não há restauração de versão; versões excluídas permanentemente não podem ser restauradas.
- Chama `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` registra uma nota de moderação na skill e no log de auditoria.
- `--note <text>` é um alias para `--reason`.
- `--yes` pula a confirmação.

### `hide <skill>`

- Oculta uma skill (proprietário, moderador ou administrador).
- Alias para `delete`.

### `unhide <skill>`

- Reexibe uma skill (proprietário, moderador ou administrador).
- Alias para `undelete`.

### `skill rename <skill> <new-name>`

- Renomeia uma skill própria e mantém o slug anterior como alias de redirecionamento.
- Chama `POST /api/v1/skills/{slug}/rename`.
- `--yes` pula a confirmação.

### `skill merge <source> <target>`

- Mescla uma skill própria em outra skill própria.
- O slug de origem deixa de ser listado publicamente e se torna um alias de redirecionamento para o destino.
- Chama `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` pula a confirmação.

### `transfer`

- Fluxo de transferência de propriedade.
- Transferências para handles de usuários criam uma solicitação pendente que o destinatário aceita.
- Transferências para handles de organizações/publicadores são aplicadas imediatamente apenas quando o ator tem
  acesso de administrador tanto ao proprietário atual quanto ao publicador de destino.
- Subcomandos:
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- Endpoints:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Navega ou pesquisa no catálogo unificado de pacotes via `GET /api/v1/packages` e `GET /api/v1/packages/search`.
- Use isto para plugins e outras entradas da família de pacotes; `search` de nível superior permanece a superfície de pesquisa de skills.
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
- `--tag <tag>`: inspeciona uma versão marcada (por exemplo, `latest`).
- `--versions`: lista o histórico de versões (primeira página).
- `--limit <n>`: máximo de versões a listar (1-100).
- `--files`: lista arquivos da versão selecionada.
- `--file <path>`: busca o conteúdo bruto do arquivo (somente arquivos de texto; limite de 200 KB).
- `--json`: saída legível por máquina.

### `package download <name>`

- Resolve uma versão de pacote por meio de
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Baixa o artefato a partir do `downloadUrl` do resolvedor.
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
- Com `--package`, resolve os metadados esperados no ClawHub e compara o
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

### `package validate <source>`

- Executa o Plugin Inspector integrado da CLI do ClawHub contra uma pasta local de pacote de plugin.
- O padrão é validação offline/estática, sem localizar nem importar um checkout local do
  OpenClaw.
- Erros graves de compatibilidade saem com código diferente de zero. Achados apenas de aviso são impressos, mas
  saem com zero.
- Flags:
  - `--out <dir>`: grava relatórios do Plugin Inspector neste diretório.
  - `--openclaw <path>`: inspeciona contra um checkout local explícito do OpenClaw.
  - `--runtime`: habilita captura de runtime; importa código de plugin.
  - `--allow-execute`: permite captura de runtime em um workspace isolado.
  - `--no-mock-sdk`: desabilita o SDK OpenClaw simulado durante a captura de runtime.
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package validate ./example-plugin
```

Se a validação relatar um achado de pacote, manifesto, importação de SDK ou artefato, consulte
[Correções de validação de plugin](/pt-BR/clawhub/plugin-validation-fixes) e execute o comando novamente.

### `package delete <name>`

- Sem `--version`, exclui temporariamente um pacote e todas as versões.
- `--version <version>` exclui permanentemente uma versão própria não mais recente por meio de uma rota fail-closed
  específica da versão.
  Versões excluídas não podem ser restauradas nem republicadas. Publique uma substituição antes de excluir a
  versão mais recente atual. Este fluxo apenas de versão exige o proprietário do pacote ou um administrador de publicador
  de organização; a equipe da plataforma não ignora a propriedade do pacote.
- A exclusão temporária do pacote inteiro exige o proprietário do pacote, um proprietário/administrador de publicador de organização, moderador
  da plataforma ou administrador da plataforma.
- Flags:
  - `--version <version>`: exclui permanentemente uma versão não mais recente.
  - `--yes`: pula a confirmação.
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- Restaura um pacote e versões excluídos temporariamente.
- Não há restauração de versão; versões excluídas permanentemente não podem ser restauradas.
- Exige o proprietário do pacote, um proprietário/administrador de publicador de organização, moderador da plataforma,
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
- Exige acesso de administrador tanto ao proprietário atual do pacote quanto ao publicador de destino,
  a menos que seja realizado por um administrador da plataforma.
- Nomes de pacotes com escopo devem ser transferidos para o proprietário de escopo correspondente.
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
- Denúncias são no nível do pacote, opcionalmente vinculadas a uma versão, e ficam visíveis
  para os moderadores analisarem.
- Denúncias não ocultam pacotes automaticamente nem bloqueiam downloads por si só.
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
  da versão mais recente, o estado de bloqueio de download e os motivos de moderação.
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
  proveniência da origem, compatibilidade com OpenClaw, destinos de host, metadados de ambiente
  e estado de varredura.
- Flags:
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Mostra o status de migração orientado a operadores para um pacote que pode substituir um
  plugin OpenClaw integrado.
- Chama o mesmo endpoint de prontidão calculada que `package readiness`, mas imprime
  status focado em migração, versão mais recente, estado de pacote oficial, verificações e
  bloqueadores.
- Flags:
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Cria um publicador de organização pertencente ao usuário autenticado.
- O handle é normalizado para minúsculas e pode ser passado com ou sem `@`.
- Publicadores de organização recém-criados não são confiáveis/oficiais por padrão.
- Falha se o handle já for usado por um publicador, usuário ou rota reservada existente.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Publica um plugin de código ou plugin de bundle via `POST /api/v1/packages`.
- `<source>` aceita:
  - Caminho de pasta local: `./my-plugin`
  - Tarball npm-pack local do ClawPack: `./my-plugin-1.2.3.tgz`
  - Repositório do GitHub: `owner/repo` ou `owner/repo@ref`
  - URL do GitHub: `https://github.com/owner/repo`
- Os metadados são detectados automaticamente a partir de `package.json`, `openclaw.plugin.json` e
  marcadores reais de bundle do OpenClaw, como `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` e `.cursor-plugin/plugin.json`.
- Fontes `.tgz` são tratadas como ClawPack. A CLI envia os bytes exatos do npm-pack
  e usa o conteúdo extraído de `package/` apenas para validação e
  preenchimento prévio de metadados.
- Pastas de plugin de código são empacotadas em um tarball npm do ClawPack antes do envio para que
  instalações do OpenClaw possam verificar o artefato exato. Pastas de plugin de bundle ainda
  usam o caminho de publicação por arquivos extraídos.
- Para fontes do GitHub, a atribuição da fonte é preenchida automaticamente a partir do repositório, commit resolvido, ref e subcaminho.
- Para pastas locais, a atribuição da fonte é detectada automaticamente a partir do git local quando o remoto origin aponta para o GitHub.
- Plugins de código externos devem declarar `openclaw.compat.pluginApi` e
  `openclaw.build.openclawVersion` explicitamente.
  `package.json.version` de nível superior não é usado como fallback para validação de publicação.
- `--dry-run` pré-visualiza o payload de publicação resolvido sem enviar.
- `--json` emite saída legível por máquina para CI.
- `--owner <handle>` publica sob um identificador de publicador de usuário ou organização quando o ator tem acesso de publicador.
- Nomes de pacote com escopo devem corresponder ao owner selecionado. Consulte `docs/publishing.md`.
- Flags existentes (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) ainda funcionam como substituições.
- Repositórios privados do GitHub exigem `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Fluxo local recomendado

Use `--dry-run` primeiro para confirmar os metadados resolvidos do pacote e
a atribuição da fonte antes de criar uma versão ativa:

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

- `package.json.version` é a versão de lançamento do seu pacote, mas não é usado como
  fallback para validação de compatibilidade/build do OpenClaw.
- `openclaw.hostTargets` e `openclaw.environment` são metadados opcionais.
  O ClawHub pode exibi-los quando presentes, mas eles não são obrigatórios para publicação.
- `openclaw.compat.minGatewayVersion` e
  `openclaw.build.pluginSdkVersion` são extras opcionais se você quiser publicar
  metadados de compatibilidade mais detalhados.
- Se você estiver usando uma versão mais antiga da CLI `clawhub`, atualize antes de publicar para que
  as verificações locais de preflight sejam executadas antes do envio.
- Se a validação relatar um código de remediação, consulte
  [Correções de validação de Plugin](/pt-BR/clawhub/plugin-validation-fixes).

#### GitHub Actions

O ClawHub também fornece um workflow reutilizável oficial em
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/76b4f36bb0f7409ed7cb9c6fd6f1ccf81396ee88/.github/workflows/package-publish.yml)
para repositórios de plugin.

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

- O workflow reutilizável define `source` como o repositório chamador por padrão.
- Para monorepos, passe `source_path` para que o workflow publique a pasta do pacote
  do plugin, por exemplo `source_path: extensions/codex`.
- Fixe o workflow reutilizável a uma tag estável ou a um SHA de commit completo. Não execute publicação de release a partir de `@main`.
- `pull_request` deve usar `dry_run: true` para que a CI permaneça sem efeitos colaterais.
- Publicações reais devem ser limitadas a eventos confiáveis, como `workflow_dispatch` ou pushes de tags.
- Publicação confiável sem segredo só funciona em `workflow_dispatch`; pushes de tags ainda precisam de `clawhub_token`.
- Mantenha `clawhub_token` disponível para a primeira publicação, pacotes não confiáveis ou publicações emergenciais.
- O workflow envia o resultado JSON como um artefato e o expõe como saídas do workflow.

### `package trusted-publisher get <name>`

- Mostra a configuração de publicador confiável do GitHub Actions para um pacote.
- Use isto depois de definir a configuração para confirmar o repositório, o nome do arquivo de workflow
  e o pin opcional de ambiente.
- Flags:
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Anexa ou substitui a configuração de publicador confiável do GitHub Actions para um pacote
  existente.
- O pacote deve ser criado primeiro por meio de uma publicação normal manual ou autenticada por token
  com `clawhub package publish`.
- Depois que a configuração for definida, publicações futuras compatíveis pelo GitHub Actions poderão usar
  OIDC/publicação confiável sem um token ClawHub de longa duração.
- `--repository <repo>` deve ser `owner/repo`.
- `--workflow-filename <file>` deve corresponder ao nome do arquivo de workflow em
  `.github/workflows/`.
- `--environment <name>` é opcional. Quando configurado, o ambiente do GitHub Actions
  na declaração OIDC deve corresponder exatamente.
- O ClawHub verifica o repositório GitHub configurado quando este comando é executado.
  Repositórios públicos podem ser verificados por meio de metadados públicos do GitHub. Repositórios
  privados exigem que o ClawHub tenha acesso do GitHub a esse repositório, por
  exemplo por meio de uma instalação futura do GitHub App do ClawHub ou outra integração
  autorizada do GitHub.
- Flags:
  - `--repository <repo>`: repositório do GitHub, por exemplo `openclaw/example-plugin`.
  - `--workflow-filename <file>`: nome do arquivo de workflow, por exemplo `package-publish.yml`.
  - `--environment <name>`: ambiente do GitHub Actions opcional com correspondência exata.
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- Remove a configuração de publicador confiável de um pacote.
- Use isto como rollback se o workflow, repositório ou pin de ambiente precisar ser
  desabilitado ou recriado.
- Publicações reais futuras devem usar publicação autenticada normal até que a configuração seja
  definida novamente.
- Flags:
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Telemetria de instalação

- Enviada após `clawhub install <slug>` quando conectado, a menos que
  `CLAWHUB_DISABLE_TELEMETRY=1` esteja definido.
- O relatório é feito em melhor esforço. Comandos de instalação não falham se a telemetria estiver
  indisponível.
- Detalhes: `docs/telemetry.md`.
