---
doc-schema-version: 1
read_when:
    - Você quer procurar, instalar, habilitar ou desabilitar plugins na interface de controle
    - Você quer exemplos rápidos para listar, instalar, atualizar, inspecionar ou desinstalar plugins
    - Você quer escolher uma fonte de instalação do plugin
    - Você precisa da referência certa para publicar pacotes de plugins
sidebarTitle: Manage plugins
summary: Gerencie os plugins do OpenClaw pela interface de controle ou CLI
title: Gerenciar plugins
x-i18n:
    generated_at: "2026-07-12T15:30:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0b235dfca7ef815cc8b0f82db6a9ba8cb344b00612ffd77ca67c8bbd379bdf2a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

A UI de Controle abrange o fluxo de trabalho comum de descoberta, instalação, ativação e desativação. A CLI acrescenta atualização, desinstalação, configuração avançada e controles explícitos da origem de instalação. Para conhecer o contrato completo dos comandos, as flags, as regras de seleção de origem e os casos extremos, consulte [`openclaw plugins`](/pt-BR/cli/plugins).

Fluxo de trabalho típico da CLI: encontre um pacote, instale-o pelo ClawHub, npm, git ou por um caminho local, deixe o Gateway gerenciado reiniciar automaticamente (ou reinicie-o manualmente) e, em seguida, verifique os registros de runtime do plugin.

## Usar a UI de Controle

Abra **Plugins** na UI de Controle ou use `/settings/plugins` em relação ao caminho base configurado da UI de Controle. Por exemplo, um caminho base `/openclaw` usa `/openclaw/settings/plugins`. A página tem duas abas:

- **Instalados** mostra o inventário local completo agrupado por categoria (canais, provedores de modelos, memória, ferramentas). Cada linha abre uma visualização detalhada; seu menu de opções (`…`) ativa ou desativa o plugin e, para plugins instalados externamente, oferece **Remover**. A aba também lista os [servidores MCP](/pt-BR/cli/mcp) configurados com as mesmas ações de ativação, desativação e remoção orientadas por menu, editando `mcp.servers` na configuração do Gateway.
- **Descobrir** é a loja: plugins em destaque incluídos no OpenClaw, plugins externos oficiais e uma seleção de conectores. Os cartões de conectores adicionam um servidor MCP hospedado com um clique (GitHub, Notion, Linear, Sentry, Home Assistant) ou abrem uma pesquisa pré-preenchida no ClawHub. Digitar na caixa de pesquisa consulta o [ClawHub](https://clawhub.ai/plugins) diretamente na página e acrescenta uma seção **Do ClawHub** com contagens de downloads e selos de verificação da origem.

Plugins incluídos não precisam da instalação de um pacote. A ação de menu deles é **Ativar** ou **Desativar**. O Workboard, por exemplo, está incluído no OpenClaw e desativado por padrão; portanto, escolha **Ativar** para ligá-lo. Plugins integrados não podem ser removidos, apenas desativados.

O acesso ao catálogo e à pesquisa exige `operator.read`. A instalação, ativação, desativação, remoção e alterações em servidores MCP exigem `operator.admin`. Uma instalação pelo ClawHub é realizada pelo Gateway e preserva as verificações de confiança, integridade e política de instalação de plugins.

Instalar ou remover o código de um plugin exige a reinicialização do Gateway. As alterações de ativação podem ser aplicadas sem reinicialização quando o plugin instalado e o runtime atual do Gateway oferecem suporte a isso; caso contrário, a UI informa que uma reinicialização é necessária. Conectores MCP com OAuth ainda precisam de uma execução única de `openclaw mcp login <name>` pela CLI depois de serem adicionados.

A UI de Controle não instala de origens npm arbitrárias, git ou caminhos locais, não atualiza plugins nem expõe configurações avançadas de plugins. Use os fluxos de trabalho da CLI abaixo para essas operações.

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

`plugins list` é uma verificação de inventário a frio: o que o OpenClaw consegue descobrir por meio da configuração, dos manifestos e do registro persistente de plugins. Ele não comprova que um Gateway já em execução importou o runtime do plugin. A saída JSON inclui diagnósticos do registro e o `dependencyStatus` de cada plugin (se as `dependencies`/`optionalDependencies` declaradas podem ser resolvidas no disco).

`plugins search` consulta o ClawHub em busca de pacotes de plugins instaláveis e exibe uma dica de instalação (`openclaw plugins install clawhub:<package>`) para cada resultado.

## Ativar e desativar plugins

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

Alterna a entrada de configuração de um plugin sem alterar os arquivos instalados. Alguns plugins integrados (provedores integrados de modelos/voz e o plugin de navegador integrado) são ativados por padrão; outros exigem `enable` após a instalação.

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

# Instale de um artefato npm-pack local.
openclaw plugins install npm-pack:<path.tgz>

# Instale pelo git ou por um checkout de desenvolvimento local.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Especificações de pacote sem prefixo são instaladas pelo npm durante a transição de lançamento, a menos que o nome corresponda ao id de um plugin integrado ou oficial; nesse caso, o OpenClaw usa a cópia local/oficial correspondente. Use `clawhub:`, `npm:`, `git:` ou `npm-pack:` para selecionar a origem de forma determinística.

Use `--force` somente para sobrescrever um destino de instalação existente proveniente de uma origem diferente. Para atualizações de rotina de uma instalação npm, ClawHub ou hook-pack rastreada, use `openclaw plugins update`; `--force` não é compatível com `--link`.

## Reiniciar e inspecionar

Um Gateway gerenciado em execução, com o recarregamento da configuração ativado, reinicia automaticamente após instalar, atualizar ou desinstalar o código de um plugin. Se o Gateway não for gerenciado ou o recarregamento estiver desativado, reinicie-o antes de verificar as superfícies de runtime ativas:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` carrega o módulo do plugin e comprova que ele registrou superfícies de runtime (ferramentas, hooks, serviços, métodos do Gateway, rotas HTTP e comandos da CLI pertencentes ao plugin). `inspect` e `list` sem opções são apenas verificações a frio de manifesto/configuração/registro.

## Atualizar plugins

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Passar o id de um plugin reutiliza sua especificação de instalação rastreada: dist-tags armazenadas (`@beta`) e versões exatas fixadas são mantidas nas execuções posteriores de `update <plugin-id>`.

`openclaw plugins update --all` é o caminho de manutenção em massa. Ele ainda respeita as especificações de instalação rastreadas comuns, mas registros confiáveis de plugins oficiais do OpenClaw são sincronizados com o destino atual do catálogo oficial, em vez de permanecerem fixados em um pacote oficial exato desatualizado; quando `update.channel` é `beta`, essa sincronização prioriza a linha de versões beta. Use um `update <plugin-id>` direcionado para manter intacta uma especificação oficial exata ou com tag.

Para instalações npm, passe uma especificação explícita de pacote para alterar o registro rastreado:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

O segundo comando move um plugin de volta para a linha de versões padrão do registro quando ele estava anteriormente fixado em uma versão exata ou tag.

Consulte [`openclaw plugins`](/pt-BR/cli/plugins#update) para conhecer as regras exatas de fallback e fixação.

## Desinstalar plugins

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

A desinstalação remove a entrada de configuração do plugin, o registro persistente no índice de plugins, as entradas das listas de permissão/bloqueio e as entradas vinculadas de `plugins.load.paths`, quando aplicável. O diretório de instalação gerenciado é removido, a menos que você passe `--keep-files`. Um Gateway gerenciado em execução reinicia automaticamente quando a desinstalação altera a origem do plugin.

No modo Nix (`OPENCLAW_NIX_MODE=1`), a instalação, atualização, desinstalação, ativação e desativação de plugins ficam desabilitadas; gerencie essas opções na origem Nix da instalação.

## Escolher uma origem

| Origem      | Use quando                                                                   | Exemplo                                                        |
| ----------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | Você quer descoberta nativa do OpenClaw, resumos de verificação, versões e dicas | `openclaw plugins install clawhub:<package>`                   |
| git         | Você quer um branch, uma tag ou um commit de um repositório                   | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| caminho local | Você está desenvolvendo ou testando um plugin na mesma máquina              | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Você está instalando um plugin de marketplace compatível com Claude           | `openclaw plugins install <plugin> --marketplace <source>`     |
| npm pack    | Você está validando um artefato de pacote local por meio da semântica de instalação do npm | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | Você já distribui pacotes JavaScript ou precisa de dist-tags/registro privado do npm | `openclaw plugins install npm:@acme/openclaw-plugin`           |

Instalações gerenciadas por caminho local devem ser diretórios ou arquivos compactados de plugins. Coloque arquivos de plugin independentes em `plugins.load.paths`, em vez de instalá-los com `plugins install`.

## Publicar plugins

O ClawHub é a principal superfície pública de descoberta de plugins do OpenClaw. Publique nele quando quiser que os usuários encontrem os metadados do plugin, o histórico de versões, os resultados da verificação do registro e as dicas de instalação antes de instalar.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Plugins npm nativos devem incluir um manifesto de plugin (`openclaw.plugin.json`) e metadados em `package.json` antes da publicação:

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

Use estas páginas para consultar o contrato completo de publicação, em vez de tratar esta página como a referência de publicação:

- [Publicação no ClawHub](/pt-BR/clawhub/publishing) explica proprietários, escopos, versões, revisão, validação e transferência de pacotes.
- [Criação de plugins](/pt-BR/plugins/building-plugins) mostra a estrutura completa de um pacote de plugin (incluindo `openclaw.plugin.json`) e o fluxo de trabalho da primeira publicação.
- [Manifesto de plugin](/pt-BR/plugins/manifest) define os campos do manifesto nativo de plugins.

Se o mesmo pacote estiver disponível no ClawHub e no npm, use o prefixo explícito `clawhub:` ou `npm:` para forçar uma das origens.

## Relacionado

- [Plugins](/pt-BR/tools/plugin) - instalar, configurar, reiniciar e solucionar problemas
- [`openclaw plugins`](/pt-BR/cli/plugins) - referência completa da CLI
- [Plugins da comunidade](/pt-BR/plugins/community) - descoberta pública e publicação no ClawHub
- [ClawHub](/pt-BR/clawhub/cli) - operações da CLI do registro
- [Criação de plugins](/pt-BR/plugins/building-plugins) - criar um pacote de plugin
- [Manifesto de plugin](/pt-BR/plugins/manifest) - manifesto e metadados do pacote
