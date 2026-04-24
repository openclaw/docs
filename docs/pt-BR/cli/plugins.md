---
read_when:
    - Você quer instalar ou gerenciar Plugins do Gateway ou pacotes compatíveis
    - Você quer depurar falhas de carregamento de Plugin
summary: Referência da CLI para `openclaw plugins` (listar, instalar, marketplace, desinstalar, ativar/desativar, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-04-24T05:46:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35ef8f54c64ea52d7618a0ef8b90d3d75841a27ae4cd689b4ca8e0cfdcddc408
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gerencie Plugins do Gateway, pacotes de hooks e pacotes compatíveis.

Relacionado:

- Sistema de Plugin: [Plugins](/pt-BR/tools/plugin)
- Compatibilidade de pacotes: [Pacotes de Plugin](/pt-BR/plugins/bundles)
- Manifesto e schema de Plugin: [Manifesto de Plugin](/pt-BR/plugins/manifest)
- Reforço de segurança: [Segurança](/pt-BR/gateway/security)

## Comandos

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Plugins incluídos são distribuídos com o OpenClaw. Alguns são ativados por padrão (por exemplo,
provedores de modelo incluídos, provedores de fala incluídos e o Plugin
de navegador incluído); outros exigem `plugins enable`.

Plugins nativos do OpenClaw devem incluir `openclaw.plugin.json` com um JSON
Schema em linha (`configSchema`, mesmo que vazio). Pacotes compatíveis usam seus próprios
manifestos de pacote.

`plugins list` mostra `Format: openclaw` ou `Format: bundle`. A saída detalhada de list/info
também mostra o subtipo do pacote (`codex`, `claude` ou `cursor`) mais as
capacidades detectadas do pacote.

### Instalar

```bash
openclaw plugins install <package>                      # ClawHub primeiro, depois npm
openclaw plugins install clawhub:<package>              # somente ClawHub
openclaw plugins install <package> --force              # sobrescreve a instalação existente
openclaw plugins install <package> --pin                # fixa a versão
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # caminho local
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explícito)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Nomes de pacote simples são verificados primeiro no ClawHub e depois no npm. Observação de segurança:
trate instalações de Plugin como execução de código. Prefira versões fixadas.

Se sua seção `plugins` for alimentada por um único `$include` de arquivo único, `plugins install/update/enable/disable/uninstall` gravam nesse arquivo incluído e deixam `openclaw.json` intocado. Includes na raiz, arrays de includes e includes com substituições irmãs falham de forma fechada em vez de serem achatados. Consulte [Includes de configuração](/pt-BR/gateway/configuration) para os formatos compatíveis.

Se a configuração for inválida, `plugins install` normalmente falha de forma fechada e orienta você a
executar `openclaw doctor --fix` primeiro. A única exceção documentada é um caminho restrito
de recuperação para Plugin incluído para Plugins que optam explicitamente por
`openclaw.install.allowInvalidConfigRecovery`.

`--force` reutiliza o destino de instalação existente e sobrescreve no local um
Plugin ou pacote de hooks já instalado. Use-o quando você estiver reinstalando intencionalmente
o mesmo ID a partir de um novo caminho local, arquivo compactado, pacote do ClawHub ou artefato npm.
Para upgrades rotineiros de um Plugin npm já rastreado, prefira
`openclaw plugins update <id-or-npm-spec>`.

Se você executar `plugins install` para um ID de Plugin já instalado, o OpenClaw
interrompe e direciona você para `plugins update <id-or-npm-spec>` para um upgrade normal,
ou para `plugins install <package> --force` quando você realmente quiser sobrescrever
a instalação atual a partir de uma fonte diferente.

`--pin` se aplica apenas a instalações via npm. Não é compatível com `--marketplace`,
porque instalações via marketplace persistem metadados de origem do marketplace em vez de uma
especificação npm.

`--dangerously-force-unsafe-install` é uma opção de emergência para falsos positivos
no scanner integrado de código perigoso. Ela permite que a instalação continue mesmo
quando o scanner integrado relata achados `critical`, mas **não**
ignora bloqueios de política de hook `before_install` do Plugin e **não** ignora falhas
de varredura.

Essa flag da CLI se aplica aos fluxos de instalação/atualização de Plugin. Instalações de dependência
de Skills apoiadas pelo Gateway usam a substituição de solicitação correspondente `dangerouslyForceUnsafeInstall`, enquanto `openclaw skills install` continua sendo um fluxo separado de
download/instalação de Skills do ClawHub.

`plugins install` também é a superfície de instalação para pacotes de hooks que expõem
`openclaw.hooks` em `package.json`. Use `openclaw hooks` para visibilidade filtrada
de hooks e ativação por hook, não para instalação de pacote.

Especificações npm são **somente de registro** (nome do pacote + **versão exata** opcional ou
**dist-tag**). Especificações git/URL/arquivo e intervalos semver são rejeitados. Instalações de dependência
são executadas com `--ignore-scripts` por segurança.

Especificações simples e `@latest` permanecem no canal estável. Se o npm resolver qualquer uma
delas para uma versão de pré-lançamento, o OpenClaw interrompe e solicita que você opte explicitamente por ela com uma
tag de pré-lançamento, como `@beta`/`@rc`, ou uma versão exata de pré-lançamento, como
`@1.2.3-beta.4`.

Se uma especificação simples de instalação corresponder a um ID de Plugin incluído (por exemplo `diffs`), o OpenClaw
instala diretamente o Plugin incluído. Para instalar um pacote npm com o mesmo
nome, use uma especificação com escopo explícito (por exemplo `@scope/diffs`).

Arquivos compatíveis: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Instalações do marketplace Claude também são compatíveis.

Instalações do ClawHub usam um localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

O OpenClaw agora também prefere o ClawHub para especificações simples de Plugin seguras para npm. Ele só
recorre ao npm se o ClawHub não tiver esse pacote ou versão:

```bash
openclaw plugins install openclaw-codex-app-server
```

O OpenClaw baixa o arquivo compactado do pacote do ClawHub, verifica a
API de Plugin anunciada / compatibilidade mínima com o gateway e depois instala pelo caminho normal
de arquivo compactado. Instalações registradas mantêm seus metadados de origem do ClawHub para atualizações futuras.

Use a forma abreviada `plugin@marketplace` quando o nome do marketplace existir no
cache local de registro do Claude em `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Use `--marketplace` quando quiser passar explicitamente a origem do marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

As origens de marketplace podem ser:

- um nome de marketplace conhecido do Claude em `~/.claude/plugins/known_marketplaces.json`
- uma raiz de marketplace local ou caminho para `marketplace.json`
- uma forma abreviada de repositório GitHub, como `owner/repo`
- uma URL de repositório GitHub, como `https://github.com/owner/repo`
- uma URL git

Para marketplaces remotos carregados de GitHub ou git, entradas de Plugin devem permanecer
dentro do repositório clonado do marketplace. O OpenClaw aceita origens de caminho relativas desse
repositório e rejeita origens de Plugin HTTP(S), caminho absoluto, git, GitHub e outras origens não baseadas em caminho vindas de manifestos remotos.

Para caminhos locais e arquivos compactados, o OpenClaw detecta automaticamente:

- Plugins nativos do OpenClaw (`openclaw.plugin.json`)
- pacotes compatíveis com Codex (`.codex-plugin/plugin.json`)
- pacotes compatíveis com Claude (`.claude-plugin/plugin.json` ou o layout padrão
  de componente do Claude)
- pacotes compatíveis com Cursor (`.cursor-plugin/plugin.json`)

Pacotes compatíveis são instalados na raiz normal de Plugin e participam
do mesmo fluxo de list/info/enable/disable. Hoje, Skills de pacote, command-skills
do Claude, padrões de `settings.json` do Claude, padrões de Claude `.lsp.json` /
`lspServers` declarados no manifesto, command-skills do Cursor e diretórios de hooks Codex compatíveis são compatíveis; outras capacidades detectadas do pacote são
mostradas em diagnósticos/info, mas ainda não estão conectadas à execução em tempo de execução.

### Listar

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Use `--enabled` para mostrar apenas Plugins carregados. Use `--verbose` para trocar da
visualização em tabela para linhas detalhadas por Plugin com metadados de origem/fonte/versão/ativação. Use `--json` para inventário legível por máquina mais
diagnósticos do registro.

Use `--link` para evitar copiar um diretório local (adiciona em `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` não é compatível com `--link`, porque instalações vinculadas reutilizam o
caminho de origem em vez de copiar sobre um destino de instalação gerenciado.

Use `--pin` em instalações npm para salvar a especificação exata resolvida (`name@version`) em
`plugins.installs`, mantendo o comportamento padrão sem fixação.

### Desinstalar

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` remove registros do Plugin de `plugins.entries`, `plugins.installs`,
da allowlist de Plugin e de entradas vinculadas em `plugins.load.paths`, quando aplicável.
Para Plugins de memória ativa, o slot de memória é redefinido para `memory-core`.

Por padrão, a desinstalação também remove o diretório de instalação do Plugin sob a raiz de Plugin do
diretório de estado ativo. Use
`--keep-files` para manter os arquivos em disco.

`--keep-config` é compatível como alias obsoleto para `--keep-files`.

### Atualizar

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

As atualizações se aplicam a instalações rastreadas em `plugins.installs` e a instalações rastreadas
de pacotes de hooks em `hooks.internal.installs`.

Quando você passa um ID de Plugin, o OpenClaw reutiliza a especificação de instalação registrada para esse
Plugin. Isso significa que dist-tags armazenadas anteriormente, como `@beta`, e versões exatas fixadas
continuam sendo usadas em execuções posteriores de `update <id>`.

Para instalações npm, você também pode passar uma especificação explícita de pacote npm com uma dist-tag
ou versão exata. O OpenClaw resolve esse nome de pacote de volta para o registro de Plugin rastreado,
atualiza esse Plugin instalado e registra a nova especificação npm para futuras
atualizações baseadas em ID.

Passar o nome do pacote npm sem versão nem tag também resolve de volta para o
registro de Plugin rastreado. Use isso quando um Plugin foi fixado em uma versão exata e
você quiser movê-lo de volta para a linha de lançamento padrão do registro.

Antes de uma atualização npm real, o OpenClaw verifica a versão do pacote instalado em relação
aos metadados do registro npm. Se a versão instalada e a identidade do artefato registrada
já corresponderem ao destino resolvido, a atualização é ignorada sem
baixar, reinstalar ou reescrever `openclaw.json`.

Quando existe um hash de integridade armazenado e o hash do artefato obtido muda,
o OpenClaw trata isso como desvio de artefato npm. O comando interativo
`openclaw plugins update` imprime os hashes esperado e real e solicita
confirmação antes de prosseguir. Auxiliares de atualização não interativos falham de forma fechada
a menos que o chamador forneça uma política explícita de continuação.

`--dangerously-force-unsafe-install` também está disponível em `plugins update` como uma
substituição de emergência para falsos positivos da varredura integrada de código perigoso durante
atualizações de Plugin. Ainda assim, isso não ignora bloqueios de política `before_install` do Plugin
nem bloqueios por falha de varredura, e se aplica apenas a atualizações de Plugin, não a atualizações
de pacote de hooks.

### Inspecionar

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Introspecção profunda de um único Plugin. Mostra identidade, status de carregamento, fonte,
capacidades registradas, hooks, ferramentas, comandos, serviços, métodos do gateway,
rotas HTTP, flags de política, diagnósticos, metadados de instalação, capacidades de pacote
e qualquer suporte detectado a servidor MCP ou LSP.

Cada Plugin é classificado pelo que ele realmente registra em tempo de execução:

- **plain-capability** — um tipo de capacidade (por exemplo, um Plugin apenas de provedor)
- **hybrid-capability** — vários tipos de capacidade (por exemplo, texto + fala + imagens)
- **hook-only** — apenas hooks, sem capacidades nem superfícies
- **non-capability** — ferramentas/comandos/serviços, mas sem capacidades

Consulte [Formas de Plugin](/pt-BR/plugins/architecture#plugin-shapes) para mais detalhes sobre o modelo de capacidades.

A flag `--json` gera um relatório legível por máquina adequado para scripts e
auditoria.

`inspect --all` renderiza uma tabela de toda a frota com colunas de forma, tipos de capacidade,
avisos de compatibilidade, capacidades de pacote e resumo de hooks.

`info` é um alias de `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` relata erros de carregamento de Plugin, diagnósticos de manifesto/descoberta e
avisos de compatibilidade. Quando tudo está limpo, ele imprime `No plugin issues
detected.`

Para falhas de forma de módulo, como exportações ausentes de `register`/`activate`, execute novamente
com `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir um resumo compacto da forma de exportação na
saída de diagnóstico.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

A listagem de marketplace aceita um caminho local de marketplace, um caminho `marketplace.json`, uma
forma abreviada de GitHub como `owner/repo`, uma URL de repositório GitHub ou uma URL git. `--json`
imprime o rótulo resolvido da origem mais o manifesto de marketplace analisado e as
entradas de Plugin.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Criando Plugins](/pt-BR/plugins/building-plugins)
- [Plugins da comunidade](/pt-BR/plugins/community)
