---
doc-schema-version: 1
read_when:
    - Você quer procurar, instalar, habilitar ou desabilitar plugins na interface de controle
    - Você quer exemplos rápidos para listar, instalar, atualizar, inspecionar ou desinstalar plugins
    - Você quer escolher uma fonte de instalação de plugin
    - Você quer a referência certa para publicar pacotes de plugins
sidebarTitle: Manage plugins
summary: Gerencie os plugins do OpenClaw pela interface de controle ou pela CLI
title: Gerenciar plugins
x-i18n:
    generated_at: "2026-07-16T12:41:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2e22483a7bfb6da4f1eafef036ebc1e2151a725e21565e0634c615ff2f168c1d
    source_path: plugins/manage-plugins.md
    workflow: 16
---

A UI de Controle abrange o fluxo de trabalho comum de descoberta, instalação,
ativação e desativação. A CLI acrescenta atualização, desinstalação, configuração
avançada e controles explícitos da origem de instalação. Para ver o contrato
completo dos comandos, as opções, as regras de seleção de origem e os casos
extremos, consulte [`openclaw plugins`](/pt-BR/cli/plugins).

Fluxo típico da CLI: encontre um pacote, instale-o pelo ClawHub, npm, git ou por
um caminho local, deixe o Gateway gerenciado reiniciar automaticamente (ou
reinicie-o manualmente) e verifique os registros de runtime do plugin.

## Usar a UI de Controle

Abra **Plugins** na UI de Controle ou use `/settings/plugins` em relação ao
caminho base configurado da UI de Controle. Por exemplo, um caminho base
`/openclaw` usa `/openclaw/settings/plugins`. A página tem duas abas:

- **Instalados** mostra o inventário local completo agrupado por categoria (canais,
  provedores de modelos, memória, ferramentas). Cada linha abre uma visualização
  de detalhes; seu menu de opções (`…`) ativa ou desativa o plugin
  e, para plugins instalados externamente, oferece **Remover**. A aba também lista
  os [servidores MCP](/pt-BR/cli/mcp) configurados com as mesmas ações de ativar,
  desativar e remover orientadas por menu, editando `mcp.servers` na
  configuração do Gateway.
- **Descobrir** é a loja: plugins em destaque incluídos no OpenClaw, plugins
  externos oficiais e uma seleção organizada de conectores. Os cartões de
  conectores adicionam um servidor MCP hospedado com um clique (GitHub, Notion,
  Linear, Sentry, Home Assistant) ou abrem uma pesquisa pré-preenchida no
  ClawHub. Digitar na caixa de pesquisa consulta o
  [ClawHub](https://clawhub.ai/plugins) diretamente e acrescenta uma seção
  **Do ClawHub** com contagens de downloads e selos de verificação da origem.

Plugins incluídos não precisam da instalação de um pacote. A ação do menu é
**Ativar** ou **Desativar**. O Workboard, por exemplo, está incluído no OpenClaw
e desativado por padrão; portanto, escolha **Ativar** para ligá-lo. Plugins
integrados não podem ser removidos, apenas desativados.

O acesso ao catálogo e à pesquisa exige `operator.read`. Alterações de
instalação, ativação, desativação, remoção e servidores MCP exigem
`operator.admin`. Uma instalação pelo ClawHub é realizada pelo Gateway e
preserva suas verificações de confiança, integridade e política de instalação
de plugins. Ativar um plugin instalado como administrador também registra essa
confiança explícita, adicionando o plugin selecionado a uma lista restritiva
`plugins.allow` existente. Uma entrada `plugins.deny` explícita continua
sendo determinante e deve ser removida antes de ativar o plugin.

Instalar ou remover o código de um plugin exige a reinicialização do Gateway.
Alterações de ativação podem ser aplicadas sem reinicialização quando o plugin
instalado e o runtime atual do Gateway oferecem suporte; caso contrário, a UI
informa que uma reinicialização é necessária. Conectores MCP baseados em OAuth
ainda precisam de uma execução única de `openclaw mcp login <name>` pela CLI após serem
adicionados.

A UI de Controle não instala a partir de origens arbitrárias do npm, git ou de
caminhos locais, não atualiza plugins nem expõe configurações avançadas de
plugins. Use os fluxos da CLI abaixo para essas operações.

## Listar e pesquisar plugins

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

`plugins list` é uma verificação de inventário a frio: o que o OpenClaw
consegue descobrir pela configuração, pelos manifestos e pelo registro
persistente de plugins. Isso não comprova que um Gateway já em execução
importou o runtime do plugin. A saída JSON inclui diagnósticos do registro e o
`dependencyStatus` de cada plugin (se os `dependencies`/`optionalDependencies`
declarados são resolvidos no disco).

`plugins search` consulta o ClawHub em busca de pacotes de plugins instaláveis
e exibe uma dica de instalação (`openclaw plugins install clawhub:<package>`) para cada resultado.

## Ativar e desativar plugins

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

Alterna a entrada de configuração de um plugin sem alterar os arquivos
instalados. Alguns plugins integrados (provedores integrados de modelos/voz e o
plugin de navegador integrado) são ativados por padrão; outros exigem
`enable` após a instalação.

## Instalar plugins

```bash
# Pesquise pacotes de plugins no ClawHub.
openclaw plugins search "calendar"

# Instale pelo ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Instale pelo npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Instale a partir de um artefato local do npm pack.
openclaw plugins install npm-pack:<path.tgz>

# Instale pelo git ou por um checkout de desenvolvimento local.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Especificações de pacote sem prefixo são instaladas pelo npm durante a
transição de lançamento, a menos que o nome corresponda ao id de um plugin
integrado ou oficial; nesse caso, o OpenClaw usa a cópia local/oficial. Use
`clawhub:`, `npm:`, `git:` ou
`npm-pack:` para selecionar a origem de forma determinística. Os pacotes
integrados e oficiais do catálogo do OpenClaw são considerados confiáveis,
assim como os pacotes do ClawHub. Novas origens arbitrárias do npm, git,
caminho/arquivo local, `npm-pack:` ou marketplace exigem
`--force` em instalações não interativas depois que a origem é
analisada e considerada confiável.

`--force` confirma uma origem que não seja do ClawHub sem solicitar
confirmação e sobrescreve um destino de instalação existente quando necessário.
Para atualizações rotineiras de uma instalação rastreada do npm, ClawHub ou
hook-pack, use `openclaw plugins update`. Com `--link`,
`--force` apenas confirma a origem; o diretório vinculado não é copiado
nem sobrescrito.

## Reiniciar e inspecionar

Um Gateway gerenciado em execução e com o recarregamento da configuração
ativado reinicia automaticamente após instalar, atualizar ou desinstalar o
código de um plugin. Se o Gateway não for gerenciado ou se o recarregamento
estiver desativado, reinicie-o manualmente antes de verificar as superfícies de
runtime ativas:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` carrega o módulo do plugin e comprova que ele registrou
superfícies de runtime (ferramentas, hooks, serviços, métodos do Gateway, rotas
HTTP e comandos da CLI pertencentes ao plugin). `inspect` simples e
`list` são apenas verificações a frio de
manifesto/configuração/registro.

## Atualizar plugins

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Fornecer o id de um plugin reutiliza sua especificação de instalação rastreada:
dist-tags armazenadas (`@beta`) e versões exatas fixadas são mantidas
nas execuções posteriores de `update <plugin-id>`.

`openclaw plugins update --all` é o caminho para manutenção em massa. Ele ainda respeita as
especificações comuns de instalação rastreadas, mas registros confiáveis de
plugins oficiais do OpenClaw são sincronizados com o destino atual do catálogo
oficial, em vez de permanecerem fixados em um pacote oficial exato e
desatualizado; quando `update.channel` é `beta`, essa
sincronização prioriza a linha de versões beta. Use um
`update <plugin-id>` direcionado para manter inalterada uma especificação oficial
exata ou com tag.

Para instalações do npm, forneça uma especificação de pacote explícita para
alterar o registro rastreado:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

O segundo comando move um plugin de volta para a linha de versões padrão do
registro quando ele estava anteriormente fixado em uma versão exata ou tag.

Consulte [`openclaw plugins`](/pt-BR/cli/plugins#update) para ver as regras exatas de
fallback e fixação.

## Desinstalar plugins

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

A desinstalação remove a entrada de configuração do plugin, o registro
persistente do índice de plugins, as entradas das listas de permissão/negação e
as entradas `plugins.load.paths` vinculadas, quando aplicável. O diretório de
instalação gerenciado é removido, a menos que seja usado
`--keep-files`. Um Gateway gerenciado em execução reinicia automaticamente
quando a desinstalação altera a origem do plugin.

No modo Nix (`OPENCLAW_NIX_MODE=1`), a instalação, atualização, desinstalação,
ativação e desativação de plugins ficam desabilitadas; gerencie essas opções no
código-fonte Nix da instalação.

## Escolher uma origem

| Origem      | Use quando                                                                    | Exemplo                                                        |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | Você quer descoberta nativa do OpenClaw, resumos de análise, versões e dicas | `openclaw plugins install clawhub:<package>`                   |
| git         | Você quer um branch, uma tag ou um commit de um repositório                  | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| caminho local | Você está desenvolvendo ou testando um plugin na mesma máquina             | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Você está instalando um plugin de marketplace compatível com Claude          | `openclaw plugins install <plugin> --marketplace <source>`     |
| npm pack    | Você está validando um artefato de pacote local pela semântica de instalação do npm | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | Você já distribui pacotes JavaScript ou precisa de dist-tags do npm/registro privado | `openclaw plugins install npm:@acme/openclaw-plugin`           |

Instalações gerenciadas por caminho local devem ser diretórios ou arquivos de
plugins. Coloque arquivos de plugins independentes em `plugins.load.paths` em vez
de instalá-los com `plugins install`.

## Publicar plugins

O ClawHub é a principal superfície pública de descoberta de plugins do
OpenClaw. Publique nele quando quiser que os usuários encontrem metadados do
plugin, histórico de versões, resultados da análise do registro e dicas de
instalação antes de instalar.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Plugins nativos do npm devem incluir um manifesto de plugin
(`openclaw.plugin.json`) e metadados `package.json` antes da publicação:

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
tratar esta página como a referência de publicação:

- [Publicação no ClawHub](/pt-BR/clawhub/publishing) explica proprietários, escopos,
  versões, revisão, validação de pacotes e transferência de pacotes.
- [Criação de plugins](/pt-BR/plugins/building-plugins) mostra a estrutura completa
  do pacote de plugin (incluindo `openclaw.plugin.json`) e o fluxo de trabalho da
  primeira publicação.
- [Manifesto de plugin](/pt-BR/plugins/manifest) define os campos do manifesto
  nativo de plugin.

Se o mesmo pacote estiver disponível no ClawHub e no npm, use o prefixo
explícito `clawhub:` ou `npm:` para forçar uma das origens.

## Relacionados

- [Plugins](/pt-BR/tools/plugin) - instalar, configurar, reiniciar e solucionar problemas
- [`openclaw plugins`](/pt-BR/cli/plugins) - referência completa da CLI
- [Plugins da comunidade](/pt-BR/plugins/community) - descoberta pública e publicação no ClawHub
- [ClawHub](/pt-BR/clawhub/cli) - operações da CLI do registro
- [Criação de plugins](/pt-BR/plugins/building-plugins) - criar um pacote de plugin
- [Manifesto de plugin](/pt-BR/plugins/manifest) - manifesto e metadados do pacote
