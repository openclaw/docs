---
read_when:
    - Você quer instalar ou gerenciar plugins do Gateway ou bundles compatíveis
    - Você quer depurar falhas de carregamento de plugins
summary: Referência da CLI para `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: plugins
x-i18n:
    generated_at: "2026-04-23T14:01:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 469364823c0766f6534c5d7eee963877f98fe23ecfa45251696a34ef65d57599
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gerencie plugins do Gateway, pacotes de hooks e bundles compatíveis.

Relacionado:

- Sistema de plugins: [Plugins](/pt-BR/tools/plugin)
- Compatibilidade de bundles: [Bundles de plugin](/pt-BR/plugins/bundles)
- Manifesto + schema de plugin: [Manifesto de plugin](/pt-BR/plugins/manifest)
- Hardening de segurança: [Segurança](/pt-BR/gateway/security)

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

Plugins integrados acompanham o OpenClaw. Alguns são habilitados por padrão (por exemplo
provedores de modelo integrados, provedores de fala integrados e o plugin de navegador
integrado); outros exigem `plugins enable`.

Plugins nativos do OpenClaw devem incluir `openclaw.plugin.json` com um JSON
Schema inline (`configSchema`, mesmo que vazio). Bundles compatíveis usam seus próprios
manifestos de bundle.

`plugins list` mostra `Format: openclaw` ou `Format: bundle`. A saída detalhada de list/info
também mostra o subtipo do bundle (`codex`, `claude` ou `cursor`) além das capacidades do bundle
detectadas.

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

Nomes simples de pacote são verificados primeiro no ClawHub e depois no npm. Observação de segurança:
trate a instalação de plugins como execução de código. Prefira versões fixadas.

Se a sua seção `plugins` estiver apoiada por um `$include` de arquivo único, `plugins install/update/enable/disable/uninstall` gravam nesse arquivo incluído e deixam `openclaw.json` intacto. Includes de raiz, arrays de include e includes com substituições irmãs falham de forma fechada em vez de serem achatados. Consulte [Includes de configuração](/pt-BR/gateway/configuration) para os formatos compatíveis.

Se a configuração for inválida, `plugins install` normalmente falha de forma fechada e instrui você a
executar `openclaw doctor --fix` primeiro. A única exceção documentada é um caminho estreito
de recuperação de plugin integrado para plugins que explicitamente optam por
`openclaw.install.allowInvalidConfigRecovery`.

`--force` reutiliza o destino de instalação existente e sobrescreve no local um
plugin ou pacote de hooks já instalado. Use quando estiver reinstalando intencionalmente
o mesmo id a partir de um novo caminho local, arquivo compactado, pacote do ClawHub ou artefato npm.
Para upgrades rotineiros de um plugin npm já rastreado, prefira
`openclaw plugins update <id-or-npm-spec>`.

Se você executar `plugins install` para um id de plugin já instalado, o OpenClaw
interrompe e aponta para `plugins update <id-or-npm-spec>` para um upgrade normal,
ou para `plugins install <package> --force` quando você realmente quiser sobrescrever
a instalação atual a partir de uma fonte diferente.

`--pin` se aplica apenas a instalações npm. Não é compatível com `--marketplace`,
porque instalações de marketplace persistem metadados de origem do marketplace em vez de uma
spec npm.

`--dangerously-force-unsafe-install` é uma opção de último recurso para falsos positivos
no scanner integrado de código perigoso. Ela permite que a instalação continue mesmo
quando o scanner integrado reporta achados `critical`, mas **não**
contorna bloqueios de política de hooks `before_install` do plugin e **não** contorna
falhas de varredura.

Essa flag de CLI se aplica a fluxos de instalação/atualização de plugin. Instalações de
dependências de Skills apoiadas pelo Gateway usam a substituição correspondente de solicitação
`dangerouslyForceUnsafeInstall`, enquanto `openclaw skills install` continua sendo um fluxo separado
de download/instalação de Skills do ClawHub.

`plugins install` também é a superfície de instalação para pacotes de hooks que expõem
`openclaw.hooks` em `package.json`. Use `openclaw hooks` para visibilidade filtrada
de hooks e habilitação por hook, não para instalação de pacote.

Specs npm são **somente de registro** (nome do pacote + **versão exata** opcional ou
**dist-tag**). Specs Git/URL/arquivo e intervalos semver são rejeitados. Instalações de
dependência são executadas com `--ignore-scripts` por segurança.

Specs simples e `@latest` permanecem na trilha estável. Se o npm resolver qualquer um
deles para uma prerelease, o OpenClaw interrompe e pede que você faça opt-in explicitamente com uma
tag de prerelease como `@beta`/`@rc` ou uma versão exata de prerelease como
`@1.2.3-beta.4`.

Se uma spec simples de instalação corresponder a um id de plugin integrado (por exemplo `diffs`), o OpenClaw
instala o plugin integrado diretamente. Para instalar um pacote npm com o mesmo
nome, use uma spec com escopo explícito (por exemplo `@scope/diffs`).

Arquivos compatíveis: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Instalações do marketplace Claude também são compatíveis.

Instalações do ClawHub usam um localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

O OpenClaw agora também prefere o ClawHub para specs simples de plugin seguras para npm. Ele só
recorre ao npm se o ClawHub não tiver esse pacote ou versão:

```bash
openclaw plugins install openclaw-codex-app-server
```

O OpenClaw baixa o arquivo do pacote do ClawHub, verifica a compatibilidade
anunciada da API de plugin / compatibilidade mínima com Gateway, e depois o instala pelo caminho
normal de arquivo compactado. As instalações registradas mantêm seus metadados de origem do ClawHub
para atualizações posteriores.

Use a forma curta `plugin@marketplace` quando o nome do marketplace existir no cache
de registro local do Claude em `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Use `--marketplace` quando quiser informar explicitamente a origem do marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

As origens de marketplace podem ser:

- um nome de marketplace conhecido do Claude em `~/.claude/plugins/known_marketplaces.json`
- uma raiz local de marketplace ou caminho `marketplace.json`
- uma forma curta de repositório GitHub como `owner/repo`
- uma URL de repositório GitHub como `https://github.com/owner/repo`
- uma URL git

Para marketplaces remotos carregados do GitHub ou git, as entradas de plugin devem permanecer
dentro do repositório de marketplace clonado. O OpenClaw aceita fontes de caminho relativo desse
repositório e rejeita fontes de plugin HTTP(S), caminho absoluto, git, GitHub e outras fontes
não baseadas em caminho de manifestos remotos.

Para caminhos locais e arquivos compactados, o OpenClaw detecta automaticamente:

- plugins nativos do OpenClaw (`openclaw.plugin.json`)
- bundles compatíveis com Codex (`.codex-plugin/plugin.json`)
- bundles compatíveis com Claude (`.claude-plugin/plugin.json` ou o layout
  padrão de componente Claude)
- bundles compatíveis com Cursor (`.cursor-plugin/plugin.json`)

Bundles compatíveis são instalados na raiz normal de plugins e participam do
mesmo fluxo de list/info/enable/disable. Atualmente, Skills de bundle, command-skills
do Claude, padrões de `settings.json` do Claude, padrões de Claude `.lsp.json` /
`lspServers` declarados no manifesto, command-skills do Cursor e diretórios de hooks Codex
compatíveis são compatíveis; outras capacidades de bundle detectadas são
mostradas em diagnostics/info, mas ainda não estão ligadas à execução em runtime.

### Listar

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Use `--enabled` para mostrar apenas plugins carregados. Use `--verbose` para alternar da
visualização em tabela para linhas de detalhe por plugin com metadados de
source/origin/version/activation. Use `--json` para inventário legível por máquina mais
diagnostics do registro.

Use `--link` para evitar copiar um diretório local (adiciona a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` não é compatível com `--link` porque instalações vinculadas reutilizam o
caminho de origem em vez de copiar para um destino de instalação gerenciado.

Use `--pin` em instalações npm para salvar a spec exata resolvida (`name@version`) em
`plugins.installs`, mantendo o comportamento padrão sem fixação.

### Desinstalar

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` remove registros de plugin de `plugins.entries`, `plugins.installs`,
da lista de permissões de plugin e das entradas vinculadas de `plugins.load.paths`, quando aplicável.
Para plugins de Active Memory, o slot de memória volta para `memory-core`.

Por padrão, a desinstalação também remove o diretório de instalação do plugin sob a
raiz de plugins do state-dir ativo. Use
`--keep-files` para manter os arquivos em disco.

`--keep-config` é compatível como alias obsoleto de `--keep-files`.

### Atualizar

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

As atualizações se aplicam às instalações rastreadas em `plugins.installs` e às instalações
rastreadas de pacotes de hooks em `hooks.internal.installs`.

Quando você passa um id de plugin, o OpenClaw reutiliza a spec de instalação registrada para esse
plugin. Isso significa que dist-tags armazenadas anteriormente, como `@beta`, e versões exatas fixadas
continuam sendo usadas em execuções posteriores de `update <id>`.

Para instalações npm, você também pode passar uma spec explícita de pacote npm com uma dist-tag
ou versão exata. O OpenClaw resolve esse nome de pacote de volta para o registro do plugin
rastreado, atualiza esse plugin instalado e registra a nova spec npm para futuras
atualizações baseadas em id.

Passar o nome do pacote npm sem versão nem tag também resolve de volta para o
registro do plugin rastreado. Use isso quando um plugin tiver sido fixado em uma versão exata e
você quiser movê-lo de volta para a linha de release padrão do registro.

Antes de uma atualização npm ao vivo, o OpenClaw verifica a versão do pacote instalado contra
os metadados do registro npm. Se a versão instalada e a identidade do artefato
registrada já corresponderem ao destino resolvido, a atualização é ignorada sem
baixar, reinstalar ou regravar `openclaw.json`.

Quando existe um hash de integridade armazenado e o hash do artefato buscado muda,
o OpenClaw trata isso como desvio de artefato npm. O comando interativo
`openclaw plugins update` imprime os hashes esperado e real e pede
confirmação antes de prosseguir. Helpers de atualização não interativos falham de forma fechada
a menos que o chamador forneça uma política explícita de continuação.

`--dangerously-force-unsafe-install` também está disponível em `plugins update` como uma
substituição de último recurso para falsos positivos da varredura integrada de código perigoso durante
atualizações de plugin. Ainda assim, ele não contorna bloqueios de política `before_install` do plugin
nem o bloqueio por falha de varredura, e se aplica somente a atualizações de plugin, não a
atualizações de pacotes de hooks.

### Inspecionar

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Inspeção profunda de um único plugin. Mostra identidade, status de carregamento, fonte,
capacidades registradas, hooks, ferramentas, comandos, serviços, métodos do Gateway,
rotas HTTP, flags de política, diagnostics, metadados de instalação, capacidades de bundle,
e qualquer suporte detectado a servidor MCP ou LSP.

Cada plugin é classificado pelo que ele realmente registra em runtime:

- **plain-capability** — um tipo de capacidade (por exemplo um plugin apenas de provedor)
- **hybrid-capability** — vários tipos de capacidade (por exemplo texto + fala + imagens)
- **hook-only** — apenas hooks, sem capacidades nem superfícies
- **non-capability** — ferramentas/comandos/serviços, mas sem capacidades

Consulte [Formatos de plugin](/pt-BR/plugins/architecture#plugin-shapes) para mais detalhes sobre o modelo de capacidades.

A flag `--json` produz um relatório legível por máquina adequado para scripts e
auditoria.

`inspect --all` renderiza uma tabela de toda a frota com colunas de formato, tipos de capacidade,
avisos de compatibilidade, capacidades de bundle e resumo de hooks.

`info` é um alias de `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` informa erros de carregamento de plugin, diagnostics de manifesto/descoberta e
avisos de compatibilidade. Quando tudo está limpo, ele imprime `No plugin issues
detected.`

Para falhas de formato de módulo, como exports `register`/`activate` ausentes, execute novamente
com `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir um resumo compacto do formato de exports na
saída de diagnóstico.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

A listagem de marketplace aceita um caminho local de marketplace, um caminho `marketplace.json`, uma
forma curta de GitHub como `owner/repo`, uma URL de repositório GitHub ou uma URL git. `--json`
imprime o rótulo da origem resolvida, além do manifesto de marketplace analisado e das
entradas de plugin.
