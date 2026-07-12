---
doc-schema-version: 1
read_when:
    - Você quer procurar, instalar, habilitar ou desabilitar plugins na interface de controle
    - Você quer exemplos rápidos de como listar, instalar, atualizar, inspecionar ou desinstalar plugins
    - Você quer escolher uma fonte de instalação do plugin
    - Você quer a referência correta para publicar pacotes de plugins
sidebarTitle: Manage plugins
summary: Gerencie os plugins do OpenClaw pela interface de controle ou pela CLI
title: Gerenciar plugins
x-i18n:
    generated_at: "2026-07-12T00:10:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b235dfca7ef815cc8b0f82db6a9ba8cb344b00612ffd77ca67c8bbd379bdf2a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

A interface de controle abrange o fluxo de trabalho comum de descoberta,
instalação, ativação e desativação. A CLI acrescenta atualização, desinstalação,
configuração avançada e controles explícitos da fonte de instalação. Para
consultar o contrato completo dos comandos, as opções, as regras de seleção de
fonte e os casos extremos, consulte [`openclaw plugins`](/pt-BR/cli/plugins).

Fluxo de trabalho típico da CLI: encontre um pacote, instale-o pelo ClawHub,
npm, git ou por um caminho local, deixe o Gateway gerenciado reiniciar
automaticamente (ou reinicie-o manualmente) e, em seguida, verifique os registros
de runtime do Plugin.

## Usar a interface de controle

Abra **Plugins** na interface de controle ou use `/settings/plugins` em relação
ao caminho-base configurado da interface de controle. Por exemplo, um
caminho-base `/openclaw` usa `/openclaw/settings/plugins`. A página tem duas
abas:

- **Instalados** mostra o inventário local completo agrupado por categoria
  (canais, provedores de modelos, memória e ferramentas). Cada linha abre uma
  visualização detalhada; seu menu de opções (`…`) ativa ou desativa o Plugin e,
  para Plugins instalados externamente, oferece **Remover**. A aba também lista
  os [servidores MCP](/pt-BR/cli/mcp) configurados com as mesmas ações de ativação,
  desativação e remoção acionadas por menu, editando `mcp.servers` na
  configuração do Gateway.
- **Descobrir** é a loja: Plugins em destaque incluídos no OpenClaw, Plugins
  externos oficiais e uma seleção organizada de conectores. Os cartões de
  conectores adicionam um servidor MCP hospedado com um clique (GitHub, Notion,
  Linear, Sentry, Home Assistant) ou abrem uma pesquisa pré-preenchida no
  ClawHub. Digitar na caixa de pesquisa consulta o
  [ClawHub](https://clawhub.ai/plugins) diretamente e acrescenta uma seção
  **Do ClawHub** com contagens de downloads e selos de verificação da fonte.

Plugins incluídos não precisam da instalação de um pacote. A ação do menu
correspondente é **Ativar** ou **Desativar**. O Workboard, por exemplo, está
incluído no OpenClaw e desativado por padrão; portanto, escolha **Ativar** para
ativá-lo. Plugins integrados não podem ser removidos, apenas desativados.

O acesso ao catálogo e à pesquisa exige `operator.read`. Instalação, ativação,
desativação, remoção e alterações em servidores MCP exigem `operator.admin`.
Uma instalação pelo ClawHub é realizada pelo Gateway e preserva suas
verificações de confiança, integridade e política de instalação de Plugins.

A instalação ou remoção do código de um Plugin exige a reinicialização do
Gateway. As alterações de ativação podem ser aplicadas sem reinicialização
quando o Plugin instalado e o runtime atual do Gateway oferecem suporte a isso;
caso contrário, a interface informa que uma reinicialização é necessária. Os
conectores MCP com OAuth ainda precisam de uma execução única de
`openclaw mcp login <name>` pela CLI após serem adicionados.

A interface de controle não instala a partir de fontes npm, git ou caminhos
locais arbitrários, não atualiza Plugins nem oferece configurações avançadas de
Plugins. Use os fluxos de trabalho da CLI abaixo para essas operações.

## Listar e pesquisar Plugins

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

`--json` para scripts:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` é uma verificação a frio do inventário: o que o OpenClaw consegue
descobrir por meio da configuração, dos manifestos e do registro persistente de
Plugins. Isso não comprova que um Gateway já em execução importou o runtime do
Plugin. A saída JSON inclui diagnósticos do registro e o `dependencyStatus` de
cada Plugin (se as `dependencies`/`optionalDependencies` declaradas podem ser
resolvidas no disco).

`plugins search` consulta o ClawHub em busca de pacotes de Plugins instaláveis e
exibe uma sugestão de instalação
(`openclaw plugins install clawhub:<package>`) para cada resultado.

## Ativar e desativar Plugins

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

Alterna a entrada de configuração de um Plugin sem alterar os arquivos
instalados. Alguns Plugins integrados (provedores integrados de modelos/fala e o
Plugin integrado de navegador) são ativados por padrão; outros exigem `enable`
após a instalação.

## Instalar Plugins

```bash
# Pesquisar pacotes de Plugins no ClawHub.
openclaw plugins search "calendar"

# Instalar pelo ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Instalar pelo npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Instalar a partir de um artefato npm-pack local.
openclaw plugins install npm-pack:<path.tgz>

# Instalar pelo git ou por um checkout de desenvolvimento local.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Especificações de pacote sem prefixo são instaladas pelo npm durante a transição
de lançamento, a menos que o nome corresponda ao id de um Plugin integrado ou
oficial; nesse caso, o OpenClaw usa essa cópia local/oficial. Use `clawhub:`,
`npm:`, `git:` ou `npm-pack:` para selecionar a fonte de forma determinística.

Use `--force` somente para sobrescrever um destino de instalação existente
proveniente de outra fonte. Para atualizações rotineiras de uma instalação npm,
ClawHub ou de pacote de hooks rastreada, use `openclaw plugins update`; `--force`
não é compatível com `--link`.

## Reiniciar e inspecionar

Um Gateway gerenciado em execução com o recarregamento de configuração ativado
reinicia automaticamente após a instalação, atualização ou desinstalação do
código de um Plugin. Se o Gateway não for gerenciado ou o recarregamento estiver
desativado, reinicie-o manualmente antes de verificar as superfícies de runtime
ativas:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` carrega o módulo do Plugin e comprova que ele registrou
superfícies de runtime (ferramentas, hooks, serviços, métodos do Gateway, rotas
HTTP e comandos da CLI pertencentes ao Plugin). `inspect` sem opções e `list`
são apenas verificações a frio de manifesto, configuração e registro.

## Atualizar Plugins

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Fornecer o id de um Plugin reutiliza sua especificação de instalação rastreada:
dist-tags armazenadas (`@beta`) e versões exatas fixadas são mantidas nas
execuções posteriores de `update <plugin-id>`.

`openclaw plugins update --all` é o caminho de manutenção em massa. Ele ainda
respeita as especificações comuns de instalação rastreadas, mas os registros
confiáveis de Plugins oficiais do OpenClaw são sincronizados com o destino atual
do catálogo oficial, em vez de permanecerem fixados em um pacote oficial exato
e desatualizado; quando `update.channel` é `beta`, essa sincronização dá
preferência à linha de versões beta. Use um `update <plugin-id>` direcionado para
manter intacta uma especificação oficial exata ou marcada.

Para instalações pelo npm, forneça uma especificação de pacote explícita para
alterar o registro rastreado:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

O segundo comando move um Plugin de volta para a linha de versões padrão do
registro quando ele estava anteriormente fixado em uma versão exata ou tag.

Consulte [`openclaw plugins`](/pt-BR/cli/plugins#update) para conhecer as regras exatas
de fallback e fixação.

## Desinstalar Plugins

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

A desinstalação remove a entrada de configuração do Plugin, o registro
persistente do índice de Plugins, as entradas das listas de permissões/negações e
as entradas vinculadas de `plugins.load.paths`, quando aplicável. O diretório de
instalação gerenciado é removido, a menos que você use `--keep-files`. Um Gateway
gerenciado em execução reinicia automaticamente quando a desinstalação altera a
fonte do Plugin.

No modo Nix (`OPENCLAW_NIX_MODE=1`), a instalação, atualização, desinstalação,
ativação e desativação de Plugins ficam desabilitadas; gerencie essas escolhas na
fonte Nix da instalação.

## Escolher uma fonte

| Fonte         | Use quando                                                                                  | Exemplo                                                        |
| ------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub       | Você quer descoberta nativa do OpenClaw, resumos de verificações, versões e sugestões       | `openclaw plugins install clawhub:<package>`                   |
| git           | Você quer um branch, uma tag ou um commit de um repositório                                 | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| caminho local | Você está desenvolvendo ou testando um Plugin na mesma máquina                              | `openclaw plugins install --link ./my-plugin`                  |
| marketplace   | Você está instalando um Plugin de marketplace compatível com Claude                         | `openclaw plugins install <plugin> --marketplace <source>`     |
| pacote npm    | Você está validando um artefato de pacote local por meio da semântica de instalação do npm  | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com     | Você já distribui pacotes JavaScript ou precisa de dist-tags npm/registro privado           | `openclaw plugins install npm:@acme/openclaw-plugin`           |

As instalações gerenciadas por caminho local devem ser diretórios ou arquivos
compactados de Plugins. Coloque arquivos independentes de Plugins em
`plugins.load.paths` em vez de instalá-los com `plugins install`.

## Publicar Plugins

O ClawHub é a principal superfície pública de descoberta de Plugins do OpenClaw.
Publique nele quando quiser que os usuários encontrem metadados do Plugin,
histórico de versões, resultados das verificações do registro e sugestões de
instalação antes de instalar.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Plugins npm nativos devem incluir um manifesto de Plugin
(`openclaw.plugin.json`) e metadados no `package.json` antes da publicação:

```json package.json
{
  "name": "@acme/openclaw-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

```bash
npm publish --access public
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Use estas páginas para consultar o contrato completo de publicação, em vez de
tratar esta página como referência de publicação:

- [Publicação no ClawHub](/pt-BR/clawhub/publishing) explica proprietários, escopos,
  versões, revisão, validação e transferência de pacotes.
- [Criação de Plugins](/pt-BR/plugins/building-plugins) mostra a estrutura completa do
  pacote do Plugin (incluindo `openclaw.plugin.json`) e o fluxo de trabalho da
  primeira publicação.
- [Manifesto de Plugin](/pt-BR/plugins/manifest) define os campos do manifesto de
  Plugin nativo.

Se o mesmo pacote estiver disponível no ClawHub e no npm, use o prefixo
explícito `clawhub:` ou `npm:` para forçar uma das fontes.

## Relacionados

- [Plugins](/pt-BR/tools/plugin) - instalar, configurar, reiniciar e solucionar
  problemas
- [`openclaw plugins`](/pt-BR/cli/plugins) - referência completa da CLI
- [Plugins da comunidade](/pt-BR/plugins/community) - descoberta pública e publicação
  no ClawHub
- [ClawHub](/pt-BR/clawhub/cli) - operações da CLI do registro
- [Criação de Plugins](/pt-BR/plugins/building-plugins) - criar um pacote de Plugin
- [Manifesto de Plugin](/pt-BR/plugins/manifest) - manifesto e metadados do pacote
