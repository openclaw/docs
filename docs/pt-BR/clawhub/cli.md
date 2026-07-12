---
read_when:
    - Usando a CLI do ClawHub
    - Depuração de instalação, atualização ou publicação
summary: 'Referência da CLI: comandos, sinalizadores, configuração e comportamento do arquivo de bloqueio.'
x-i18n:
    generated_at: "2026-07-12T21:30:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 498d27d82a34ad43af9fc7bc0d40e844c6a14ededc8a017d6fa33768eec4b452
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

Pacote da CLI: `clawhub`, binário: `clawhub`.

Instale-o globalmente com npm ou pnpm:

```bash
npm i -g clawhub
# ou
pnpm add -g clawhub
```

Em seguida, verifique a instalação:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## Opções globais

- `--workdir <dir>`: diretório de trabalho (padrão: cwd; usa o espaço de trabalho do Clawdbot como alternativa, se configurado)
- `--dir <dir>`: diretório de instalação dentro do diretório de trabalho (padrão: `skills`)
- `--site <url>`: URL base para login pelo navegador (padrão: `https://clawhub.ai`)
- `--registry <url>`: URL base da API (padrão: descoberta; caso contrário, `https://clawhub.ai`)
- `--no-input`: desativa solicitações de entrada

Variáveis de ambiente equivalentes:

- `CLAWHUB_SITE` (legada: `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (legada: `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (legada: `CLAWDHUB_WORKDIR`)

### Proxy HTTP

A CLI respeita as variáveis de ambiente padrão de proxy HTTP para sistemas atrás
de proxies corporativos ou redes restritas:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Quando qualquer uma dessas variáveis está definida, a CLI encaminha as solicitações de saída pelo
proxy especificado. `HTTPS_PROXY` é usada para solicitações HTTPS, e `HTTP_PROXY`,
para HTTP simples. `NO_PROXY` / `no_proxy` é respeitada para ignorar o proxy para
hosts ou domínios específicos.

Isso é necessário em sistemas nos quais conexões diretas de saída estão bloqueadas
(por exemplo, contêineres Docker, VPS da Hetzner com internet somente via proxy e
firewalls corporativos).

Exemplo:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "minha consulta"
```

Quando nenhuma variável de proxy está definida, o comportamento permanece inalterado (conexões diretas).

## Arquivo de configuração

Armazena seu token da API e a URL do registro em cache.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` ou `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Alternativa legada: se `clawhub/config.json` ainda não existir, mas `clawdhub/config.json` existir, a CLI reutilizará o caminho legado
- substituição: `CLAWHUB_CONFIG_PATH` (legada: `CLAWDHUB_CONFIG_PATH`)

## Comandos

### `login` / `auth login`

- Padrão: abre o navegador em `<site>/cli/auth` e conclui por meio de um callback de loopback.
- Sem interface gráfica: `clawhub login --token clh_...`
- Interativo remoto/sem interface gráfica: `clawhub login --device` exibe um código e aguarda enquanto você o autoriza em `<site>/cli/device`.

### `whoami`

- Verifica o token armazenado por meio de `/api/v1/whoami`.

### `token`

- Exibe o token da API armazenado na saída padrão.
- Útil para encaminhar um token de login local a comandos de configuração de segredos de CI.

### `star <skill>` / `unstar <skill>`

- Adiciona/remove uma Skill dos seus destaques.
- Chama `POST /api/v1/stars/<slug>` e `DELETE /api/v1/stars/<slug>`.
- `--yes` ignora a confirmação.

### `search <query...>`

- Chama `/api/v1/search?q=...`.
- A saída inclui o slug da Skill, o identificador do proprietário, o nome de exibição e a pontuação de relevância.
- A pesquisa prioriza correspondências exatas de tokens do slug/nome antes da popularidade de downloads. Um token de slug independente, como `map`, corresponde a `personal-map` com mais relevância do que à substring dentro de `amap`.
- A popularidade tem pouco peso prévio na classificação, não sendo garantia de uma das primeiras posições.
- Se uma Skill deveria aparecer, mas não aparece, execute `clawhub inspect @owner/slug` enquanto estiver conectado para verificar diagnósticos de moderação visíveis ao proprietário antes de renomear os metadados.

### `explore`

- Lista as Skills mais recentes por meio de `/api/v1/skills?limit=...&sort=createdAt` (ordenadas por `createdAt` em ordem decrescente).
- Opções:
  - `--limit <n>` (1-200, padrão: 25)
  - `--sort newest|updated|rating|downloads|trending` (padrão: newest). Os aliases legados de ordenação de instalações continuam funcionando para compatibilidade.
  - `--json` (saída legível por máquina)
- Saída: `<slug>  v<version>  <age>  <summary>` (resumo truncado em 50 caracteres).

### `inspect @owner/slug`

- Obtém os metadados e os arquivos de versão da Skill sem instalá-la.
- `--version <version>`: inspeciona uma versão específica (padrão: mais recente).
- `--tag <tag>`: inspeciona uma versão com tag (por exemplo, `latest`).
- `--versions`: lista o histórico de versões (primeira página).
- `--limit <n>`: número máximo de versões a listar (1-200).
- `--files`: lista os arquivos da versão selecionada.
- `--file <path>`: obtém o conteúdo bruto do arquivo (somente arquivos de texto; limite de 200KB).
- `--json`: saída legível por máquina.

### `install @owner/slug`

- Resolve a versão mais recente para o proprietário e a Skill informados.
- Baixa o arquivo zip por meio de `/api/v1/download`.
- Extrai em `<workdir>/<dir>/<slug>`.
- Recusa-se a substituir Skills fixadas; primeiro, execute `clawhub unpin <skill>`.
- Grava:
  - `<workdir>/.clawhub/lock.json` (legado: `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (legado: `.clawdhub`)

### `uninstall <skill>`

- Remove `<workdir>/<dir>/<slug>` e exclui a entrada do arquivo de bloqueio.
- Envia telemetria com base no melhor esforço enquanto você está conectado, para que as contagens de instalações atuais possam ser
  desativadas.
- Interativo: solicita confirmação.
- Não interativo (`--no-input`): exige `--yes`.

### `list`

- Lê `<workdir>/.clawhub/lock.json` (legado: `.clawdhub`).
- Exibe `pinned` ao lado das Skills congeladas com `clawhub pin`, incluindo o motivo opcional.

### `pin <skill>`

- Marca uma Skill instalada como fixada no arquivo de bloqueio.
- `--reason <text>` registra por que a Skill está congelada.
- Skills fixadas são ignoradas por `update --all` e rejeitadas por `update <skill>` direto.
- Skills fixadas também rejeitam `install --force` para que os bytes locais não sejam substituídos acidentalmente.

### `unpin <skill>`

- Remove do arquivo de bloqueio a fixação de uma Skill instalada, permitindo que atualizações futuras a modifiquem.

### `update [@owner/slug]` / `update --all`

- Calcula a impressão digital a partir dos arquivos locais.
- Se a impressão digital corresponder a uma versão conhecida: não solicita confirmação.
- Se a impressão digital não corresponder:
  - recusa por padrão
  - substitui com `--force` (ou após confirmação, se for interativo)
- Skills fixadas nunca são atualizadas por `--force`.
- `update <skill>` falha imediatamente para Skills fixadas e instrui você a executar primeiro `clawhub unpin <skill>`.
- `update --all` ignora slugs fixados e exibe um resumo do que permaneceu congelado.

### `skill publish <path>`

- Compara a impressão digital do pacote local com o ClawHub e encerra com sucesso quando
  o conteúdo já está publicado.
- Novas Skills usam `1.0.0` por padrão; Skills alteradas usam por padrão a próxima versão
  de patch.
- `--version <version>` seleciona explicitamente uma versão e publica mesmo quando o
  conteúdo corresponde a uma versão existente.
- `--dry-run` resolve a publicação sem enviar arquivos; `--json` exibe um
  resultado legível por máquina.
- `--owner <handle>` publica sob o identificador de uma organização/um usuário publicador quando o
  agente tem acesso de publicador.
- `--migrate-owner` move uma Skill existente para `--owner` durante a publicação de uma nova
  versão. Exige acesso de administrador/proprietário em ambos os publicadores.
- O comportamento de proprietário e revisão é explicado em `docs/publishing.md`.
- Publicar uma Skill significa que ela é lançada sob a licença `MIT-0` no ClawHub.
- Skills publicadas podem ser usadas, modificadas e redistribuídas gratuitamente sem atribuição.
- O ClawHub não oferece suporte a Skills pagas nem a preços individuais por Skill.
- Alias legado: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

O fluxo de trabalho reutilizável
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
do ClawHub chama `skill publish` para um `skill_path` ou para cada pasta de Skill
imediata dentro de `root` (padrão: `skills`). Ele ignora Skills inalteradas e usa o
mesmo comportamento automático de versão de patch.

Defina `dry_run: true` para visualizar sem um token. Publicações reais exigem o
segredo `clawhub_token`.

### `sync`

- Examina o diretório de trabalho atual, o diretório de Skills configurado e quaisquer
  pastas `--root <dir>` em busca de pastas de Skills locais que contenham `SKILL.md` ou
  `skill.md`.
- Compara a impressão digital de cada Skill local com o ClawHub e publica somente Skills novas ou
  alteradas.
- Novas Skills são publicadas como `1.0.0`; Skills alteradas publicam por padrão a próxima versão
  de patch. Use `--bump minor|major` para lotes de atualização que devam avançar um
  incremento semver maior.
- `--dry-run` exibe o plano de publicação sem enviar arquivos; `--json` exibe um
  plano legível por máquina.
- `--all` publica todas as Skills novas ou alteradas sem solicitar confirmação. Sem
  `--all`, terminais interativos permitem selecionar as Skills que serão publicadas.
- `--owner <handle>` publica sob o identificador de uma organização/um usuário publicador quando o
  agente tem acesso de publicador.
- `sync` realiza apenas publicação unidirecional. Ele não instala, atualiza, baixa nem
  relata telemetria de instalações/downloads.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Exige `clawhub login`.
- Executa o ClawScan do ClawHub por meio de `POST /api/v1/skills/-/scan` e consulta periodicamente até que a verificação chegue a um estado terminal.
- As verificações são assíncronas e podem levar tempo para serem concluídas. Enquanto estão na fila, o indicador giratório do terminal mostra a posição priorizada atual da verificação e quantas verificações estão à frente.
- Verificações publicadas exigem propriedade ou acesso de gerenciamento do publicador. Moderadores/administradores podem usar o mesmo backend por meio de `clawhub-admin`.
- `--update` é válido somente com `--slug`; ele grava os resultados de verificações publicadas bem-sucedidas na versão selecionada.
- `--output <file.zip>` baixa o arquivo completo do relatório com `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` e `README.md`.
- `--json` exibe a resposta completa da consulta periódica para automação.
- Verificações de caminhos locais não são mais compatíveis. Envie uma nova versão e use `scan download` para obter os resultados armazenados da verificação dessa versão enviada.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Exige `clawhub login`.
- Baixa o ZIP do relatório de verificação armazenado para uma versão enviada de uma Skill ou Plugin, incluindo versões bloqueadas ou ocultadas pelas verificações de segurança do ClawHub.
- Downloads de Skills usam o slug da Skill e o padrão `--kind skill`.
- Downloads de Plugins usam o nome do pacote e exigem `--kind plugin`.
- `--version` é obrigatório para que os autores inspecionem exatamente a versão enviada que o ClawHub bloqueou.
- `--output <file.zip>` escolhe o caminho de destino.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

O ClawHub fornece um fluxo de trabalho reutilizável oficial em
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/873b7e9a3403dbaa2c66ef15b655803562bd63c0/.github/workflows/skill-publish.yml)
para repositórios de Skills e repositórios de catálogo.

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

- `root` usa `skills` por padrão em repositórios de catálogo.
- Passe `skill_path: skills/review-helper` para processar uma pasta de Skill.
- `owner` corresponde à opção `--owner` da CLI; omita-a para publicar como o usuário autenticado.
- A publicação de Skills V1 usa `clawhub_token`; a publicação confiável por OIDC do GitHub é exclusiva para pacotes por enquanto.

### `delete <skill>`

- Sem `--version`, exclui logicamente uma Skill (proprietário, moderador ou administrador).
- Chama `DELETE /api/v1/skills/{slug}`.
- Exclusões lógicas iniciadas pelo proprietário reservam o slug por 30 dias; o comando exibe o horário de expiração.
- `--version <version>` exclui permanentemente uma versão que pertença ao usuário e não seja a mais recente por meio de uma rota específica da versão, com falha segura.
  Versões excluídas não podem ser restauradas nem republicadas. Publique uma substituta antes de excluir a
  versão mais recente atual. A equipe da plataforma não ignora a propriedade nesse fluxo exclusivo de versão.
- `--reason <text>` registra uma observação de moderação na exclusão lógica de toda a Skill e no log de auditoria.
- `--note <text>` é um alias de `--reason`.
- `--yes` ignora a confirmação.

### `undelete <skill>`

- Restaura uma Skill oculta (proprietário, moderador ou administrador).
- Não há restauração de versão; versões excluídas permanentemente não podem ser restauradas.
- Chama `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` registra uma observação de moderação na Skill e no log de auditoria.
- `--note <text>` é um alias de `--reason`.
- `--yes` ignora a confirmação.

### `hide <skill>`

- Oculta uma Skill (proprietário, moderador ou administrador).
- Alias de `delete`.

### `unhide <skill>`

- Reexibe uma Skill (proprietário, moderador ou administrador).
- Alias de `undelete`.

### `skill rename <skill> <new-name>`

- Renomeia uma Skill pertencente ao usuário e mantém o slug anterior como alias de redirecionamento.
- Chama `POST /api/v1/skills/{slug}/rename`.
- `--yes` ignora a confirmação.

### `skill merge <source> <target>`

- Mescla uma Skill pertencente ao usuário em outra Skill pertencente ao usuário.
- O slug de origem deixa de aparecer publicamente e se torna um alias de redirecionamento para o destino.
- Chama `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` ignora a confirmação.

### `transfer`

- Fluxo de trabalho de transferência de propriedade.
- Transferências para identificadores de usuários criam uma solicitação pendente que o destinatário aceita.
- Transferências para identificadores de organizações/publicadores são aplicadas imediatamente somente quando o agente tem
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

- Navega ou pesquisa no catálogo unificado de pacotes por meio de `GET /api/v1/packages` e `GET /api/v1/packages/search`.
- Use isso para plugins e outras entradas de famílias de pacotes; o `search` de nível superior continua sendo a interface de pesquisa de Skills.
- Opções:
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

- Obtém os metadados do pacote sem instalá-lo.
- Use isso para inspecionar metadados, compatibilidade, verificação, origem e versões/arquivos de plugins.
- `--version <version>`: inspeciona uma versão específica (padrão: mais recente).
- `--tag <tag>`: inspeciona uma versão com tag (por exemplo, `latest`).
- `--versions`: lista o histórico de versões (primeira página).
- `--limit <n>`: número máximo de versões a listar (1-100).
- `--files`: lista os arquivos da versão selecionada.
- `--file <path>`: obtém o conteúdo bruto do arquivo (somente arquivos de texto; limite de 200KB).
- `--json`: saída legível por máquina.

### `package download <name>`

- Resolve uma versão de pacote por meio de
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Baixa o artefato do `downloadUrl` do resolvedor.
- Verifica o SHA-256 do ClawHub para todos os artefatos.
- Para artefatos npm-pack do ClawPack, também verifica a integridade `sha512` do npm,
  o shasum do npm e o nome/versão no `package.json` do tarball.
- Versões ZIP legadas são baixadas pela rota ZIP legada.
- Opções:
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

- Calcula o SHA-256 do ClawHub, a integridade `sha512` do npm e o shasum do npm para um
  artefato local.
- Com `--package`, resolve os metadados esperados no ClawHub e compara o
  arquivo local aos metadados do artefato publicado.
- Com opções diretas de resumo, verifica sem consulta à rede.
- Opções:
  - `--package <name>`: nome do pacote para resolver os metadados esperados do artefato.
  - `--version <version>` ou `--tag <tag>`: versão esperada do pacote.
  - `--sha256 <hex>`: SHA-256 esperado do ClawHub.
  - `--npm-integrity <sri>`: integridade esperada do npm.
  - `--npm-shasum <sha1>`: shasum esperado do npm.
  - `--json`: saída legível por máquina.

Exemplos:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- Executa o Plugin Inspector incluído na CLI do ClawHub em uma pasta local de pacote de
  plugin.
- Por padrão, realiza validação offline/estática, sem localizar nem importar um checkout
  local do OpenClaw.
- Erros graves de compatibilidade encerram com código diferente de zero. Constatações que são apenas avisos são exibidas, mas
  encerram com código zero.
- Opções:
  - `--out <dir>`: grava os relatórios do Plugin Inspector neste diretório.
  - `--openclaw <path>`: inspeciona em relação a um checkout local explícito do OpenClaw.
  - `--runtime`: habilita a captura em tempo de execução; importa o código do plugin.
  - `--allow-execute`: permite a captura em tempo de execução em um espaço de trabalho isolado.
  - `--no-mock-sdk`: desabilita a simulação do SDK do OpenClaw durante a captura em tempo de execução.
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package validate ./example-plugin
```

Se a validação relatar uma constatação sobre pacote, manifesto, importação do SDK ou artefato, consulte
[Correções de validação de plugins](/clawhub/plugin-validation-fixes) e execute o comando novamente.

### `package delete <name>`

- Sem `--version`, exclui logicamente um pacote e todas as versões.
- `--version <version>` exclui permanentemente uma versão que pertença ao usuário e não seja a mais recente por meio de uma rota específica da versão, com falha segura.
  Versões excluídas não podem ser restauradas nem republicadas. Publique uma substituta antes de excluir a
  versão mais recente atual. Esse fluxo exclusivo de versão exige o proprietário do pacote ou um administrador do
  publicador da organização; a equipe da plataforma não ignora a propriedade do pacote.
- A exclusão lógica de todo o pacote exige o proprietário do pacote, um proprietário/administrador do publicador da organização, um
  moderador da plataforma ou um administrador da plataforma.
- Opções:
  - `--version <version>`: exclui permanentemente uma versão que não seja a mais recente.
  - `--yes`: ignora a confirmação.
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- Restaura um pacote excluído logicamente e suas versões.
- Não há restauração de versão; versões excluídas permanentemente não podem ser restauradas.
- Exige o proprietário do pacote, um proprietário/administrador do publicador da organização, um moderador da plataforma
  ou um administrador da plataforma.
- Chama `POST /api/v1/packages/{name}/undelete`.
- Opções:
  - `--yes`: ignora a confirmação.
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Transfere um pacote para outro publicador.
- Exige acesso de administrador tanto ao proprietário atual do pacote quanto ao publicador de
  destino, salvo quando realizado por um administrador da plataforma.
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
- As denúncias se aplicam ao pacote, podem ser vinculadas opcionalmente a uma versão e ficam visíveis
  aos moderadores para análise.
- As denúncias, por si só, não ocultam pacotes automaticamente nem bloqueiam downloads.
- Opções:
  - `--version <version>`: versão opcional do pacote a ser vinculada à denúncia.
  - `--reason <text>`: motivo obrigatório da denúncia.
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "carga nativa suspeita"
```

### `package moderation-status`

- Comando do proprietário para verificar a visibilidade de moderação do pacote.
- Chama `GET /api/v1/packages/{name}/moderation`.
- Mostra o estado atual da verificação do pacote, a contagem de denúncias abertas, o estado de
  moderação manual da versão mais recente, o estado de bloqueio de downloads e os motivos de moderação.
- Opções:
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Verifica se um pacote está pronto para consumo futuro pelo OpenClaw.
- Chama `GET /api/v1/packages/{name}/readiness`.
- Relata impedimentos relacionados ao status oficial, à disponibilidade do ClawPack, ao resumo do artefato,
  à procedência da origem, à compatibilidade com o OpenClaw, aos destinos de host, aos metadados do ambiente
  e ao estado da verificação.
- Opções:
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Mostra o estado da migração voltado a operadores para um pacote que pode substituir um
  plugin incluído no OpenClaw.
- Chama o mesmo endpoint de prontidão calculada que `package readiness`, mas exibe
  o estado voltado à migração, a versão mais recente, o estado de pacote oficial, as verificações e
  os impedimentos.
- Opções:
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Cria um publicador de organização pertencente ao usuário autenticado.
- O identificador é normalizado para letras minúsculas e pode ser fornecido com ou sem `@`.
- Publicadores de organizações recém-criados não são confiáveis/oficiais por padrão.
- Falha se o identificador já for usado por um publicador ou usuário existente ou por uma rota reservada.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Publica um plugin de código ou plugin de pacote por meio de `POST /api/v1/packages`.
- `<source>` aceita:
  - Caminho de pasta local: `./my-plugin`
  - Tarball npm-pack local do ClawPack: `./my-plugin-1.2.3.tgz`
  - Repositório do GitHub: `owner/repo` ou `owner/repo@ref`
  - URL do GitHub: `https://github.com/owner/repo`
- Os metadados são detectados automaticamente em `package.json`, `openclaw.plugin.json` e
  marcadores reais de pacotes do OpenClaw, como `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` e `.cursor-plugin/plugin.json`.
- Fontes `.tgz` são tratadas como ClawPack. A CLI envia os bytes exatos do npm-pack
  e usa o conteúdo extraído de `package/` somente para validação e
  preenchimento prévio de metadados.
- As pastas de plugins de código são empacotadas em um tarball npm do ClawPack antes do envio, para que
  as instalações do OpenClaw possam verificar o artefato exato. As pastas de plugins de pacote ainda
  usam o caminho de publicação de arquivos extraídos.
- Para fontes do GitHub, a atribuição da fonte é preenchida automaticamente com o repositório, o commit resolvido, a ref e o subcaminho.
- Para pastas locais, a atribuição da fonte é detectada automaticamente pelo git local quando o remoto origin aponta para o GitHub.
- Plugins de código externos devem declarar `openclaw.compat.pluginApi` e
  `openclaw.build.openclawVersion` explicitamente.
  O `package.json.version` de nível superior não é usado como fallback para a validação de publicação.
- `--dry-run` mostra uma prévia do payload de publicação resolvido sem fazer o envio.
- `--json` emite uma saída legível por máquina para CI.
- `--owner <handle>` publica usando o identificador de editor de um usuário ou organização quando o ator tem acesso de editor.
- Os nomes de pacotes com escopo devem corresponder ao proprietário selecionado. Consulte `docs/publishing.md`.
- Os sinalizadores existentes (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) continuam funcionando como substituições.
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

Plugins de código externos precisam de uma pequena quantidade de metadados do OpenClaw no
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
  fallback para a validação de compatibilidade/build do OpenClaw.
- `openclaw.hostTargets` e `openclaw.environment` são metadados opcionais.
  O ClawHub pode exibi-los quando presentes, mas eles não são obrigatórios para a publicação.
- `openclaw.compat.minGatewayVersion` e
  `openclaw.build.pluginSdkVersion` são extras opcionais caso você queira publicar
  metadados de compatibilidade mais detalhados.
- Se estiver usando uma versão mais antiga da CLI `clawhub`, atualize antes de publicar para que
  as verificações prévias locais sejam executadas antes do envio.
- Se a validação informar um código de correção, consulte
  [Correções de validação de plugins](/clawhub/plugin-validation-fixes).

#### GitHub Actions

O ClawHub também fornece um workflow reutilizável oficial em
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/873b7e9a3403dbaa2c66ef15b655803562bd63c0/.github/workflows/package-publish.yml)
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

- O workflow reutilizável usa por padrão o repositório chamador como `source`.
- Para monorepositórios, passe `source_path` para que o workflow publique a pasta do pacote
  do plugin, por exemplo, `source_path: extensions/codex`.
- Fixe o workflow reutilizável em uma tag estável ou no SHA completo do commit. Não execute a publicação de versões a partir de `@main`.
- `pull_request` deve usar `dry_run: true` para que a CI não gere efeitos persistentes.
- Publicações reais devem ser limitadas a eventos confiáveis, como `workflow_dispatch` ou pushes de tags.
- A publicação confiável sem um segredo só funciona em `workflow_dispatch`; pushes de tags ainda precisam de `clawhub_token`.
- Mantenha `clawhub_token` disponível para a primeira publicação, pacotes não confiáveis ou publicações emergenciais.
- O workflow envia o resultado JSON como artefato e o disponibiliza como saídas do workflow.

### `package trusted-publisher get <name>`

- Exibe a configuração de editor confiável do GitHub Actions para um pacote.
- Use este comando após definir a configuração para confirmar o repositório, o nome do arquivo do workflow
  e a fixação opcional do ambiente.
- Sinalizadores:
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Anexa ou substitui a configuração de editor confiável do GitHub Actions para um pacote
  existente.
- O pacote deve ser criado primeiro por meio de uma publicação normal manual ou autenticada por token com
  `clawhub package publish`.
- Após definir a configuração, futuras publicações compatíveis pelo GitHub Actions podem usar
  OIDC/publicação confiável sem um token de longa duração do ClawHub.
- `--repository <repo>` deve ser `owner/repo`.
- `--workflow-filename <file>` deve corresponder ao nome do arquivo do workflow em
  `.github/workflows/`.
- `--environment <name>` é opcional. Quando configurado, o ambiente do GitHub Actions
  na declaração OIDC deve corresponder exatamente.
- O ClawHub verifica o repositório do GitHub configurado quando este comando é executado.
  Repositórios públicos podem ser verificados por meio dos metadados públicos do GitHub. Repositórios
  privados exigem que o ClawHub tenha acesso do GitHub a esse repositório, por
  exemplo, por meio de uma futura instalação do GitHub App do ClawHub ou de outra integração
  autorizada do GitHub.
- Sinalizadores:
  - `--repository <repo>`: repositório do GitHub, por exemplo, `openclaw/example-plugin`.
  - `--workflow-filename <file>`: nome do arquivo do workflow, por exemplo, `package-publish.yml`.
  - `--environment <name>`: ambiente opcional do GitHub Actions com correspondência exata.
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- Remove a configuração de editor confiável de um pacote.
- Use este comando como reversão caso o workflow, o repositório ou a fixação do ambiente precise
  ser desativado ou recriado.
- Futuras publicações reais deverão usar a publicação autenticada normal até que a configuração seja
  definida novamente.
- Sinalizadores:
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Telemetria de instalação

- Enviada após `clawhub install <slug>` quando há uma sessão iniciada, a menos que
  `CLAWHUB_DISABLE_TELEMETRY=1` esteja definido.
- O envio é feito em caráter de melhor esforço. Os comandos de instalação não falham se a telemetria estiver
  indisponível.
- Detalhes: `docs/telemetry.md`.
