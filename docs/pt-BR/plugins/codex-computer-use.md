---
read_when:
    - Você quer que agentes OpenClaw em modo Codex usem Codex Computer Use
    - Você está decidindo entre Codex Computer Use, PeekabooBridge e MCP cua-driver direto
    - Você está decidindo entre o Codex Computer Use e uma configuração MCP direta com cua-driver
    - Você está configurando computerUse para o Plugin Codex incluído
    - Você está solucionando problemas de status ou instalação do /codex computer-use
summary: Configure o Codex Computer Use para agentes OpenClaw em modo Codex
title: Uso do Computador pelo Codex
x-i18n:
    generated_at: "2026-05-03T05:50:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08383e88ca02dccc86c622c3295478e950fdd222ef16947465e0de1dacafa56c
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use é um Plugin MCP nativo do Codex para controle local da área de trabalho. O OpenClaw
não incorpora o app de desktop, não executa ações de desktop por conta própria nem contorna
as permissões do Codex. O Plugin `codex` incluído apenas prepara o app-server do Codex:
ele habilita o suporte a Plugin do Codex, encontra ou instala o Plugin Codex
Computer Use configurado, verifica se o servidor MCP `computer-use` está disponível e
então deixa o Codex ser responsável pelas chamadas nativas de ferramentas MCP durante turnos em modo Codex.

Use esta página quando o OpenClaw já estiver usando o harness nativo do Codex. Para a
configuração do runtime em si, consulte [harness do Codex](/pt-BR/plugins/codex-harness).

## OpenClaw.app e Peekaboo

A integração Peekaboo do OpenClaw.app é separada do Codex Computer Use. O
app macOS pode hospedar um soquete PeekabooBridge para que a CLI `peekaboo` reutilize as
concessões locais de Acessibilidade e Gravação de Tela do app para as próprias
ferramentas de automação do Peekaboo. Essa ponte não instala nem faz proxy do Codex Computer Use, e
o Codex Computer Use não chama através do soquete PeekabooBridge.

Use [ponte Peekaboo](/pt-BR/platforms/mac/peekaboo) quando quiser que o OpenClaw.app seja
um host ciente de permissões para automação da CLI Peekaboo. Use esta página quando um
agente OpenClaw em modo Codex deve ter o Plugin MCP `computer-use` nativo do Codex
disponível antes do início do turno.

## App iOS

O app iOS é separado do Codex Computer Use. Ele não instala nem faz proxy do
servidor MCP `computer-use` do Codex e não é um backend de controle de desktop.
Em vez disso, o app iOS se conecta como um nó OpenClaw e expõe capacidades
móveis por meio de comandos de nó como `canvas.*`, `camera.*`, `screen.*`,
`location.*` e `talk.*`.

Use [iOS](/pt-BR/platforms/ios) quando quiser que um agente controle um nó iPhone por meio
do Gateway. Use esta página quando um agente em modo Codex deve controlar a área de trabalho
macOS local por meio do Plugin Computer Use nativo do Codex.

## MCP direto do cua-driver

Codex Computer Use não é a única forma de expor controle de desktop. Se você quiser
que runtimes gerenciados pelo OpenClaw chamem diretamente o driver da TryCua, use o servidor
`cua-driver mcp` upstream por meio do registro MCP do OpenClaw em vez do
fluxo de marketplace específico do Codex.

Depois de instalar `cua-driver`, peça a ele o comando do OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

ou registre você mesmo o servidor stdio:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Esse caminho mantém intacta a superfície de ferramentas MCP upstream, incluindo os esquemas
do driver e as respostas MCP estruturadas. Use-o quando quiser que o driver CUA
esteja disponível como um servidor MCP normal do OpenClaw. Use a configuração Codex Computer Use
nesta página quando o app-server do Codex deve ser responsável pela instalação do Plugin, recarregamentos de MCP
e chamadas nativas de ferramentas dentro de turnos em modo Codex.

O driver da CUA é específico do macOS e ainda exige as permissões locais do macOS
que seu app solicita, como Acessibilidade e Gravação de Tela. O OpenClaw
não instala `cua-driver`, concede essas permissões nem contorna o modelo de segurança
do driver upstream.

## Configuração rápida

Defina `plugins.entries.codex.config.computerUse` quando turnos em modo Codex precisarem ter
Computer Use disponível antes de uma thread começar:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Com essa configuração, o OpenClaw verifica o app-server do Codex antes de cada turno em modo Codex.
Se o Computer Use estiver ausente, mas o app-server do Codex já tiver descoberto um
marketplace instalável, o OpenClaw pede ao app-server do Codex para instalar ou reabilitar
o Plugin e recarregar os servidores MCP. No macOS, quando nenhum marketplace correspondente está
registrado e o bundle padrão do app Codex existe, o OpenClaw também tenta
registrar o marketplace Codex incluído de
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` antes de
falhar. Se a configuração ainda não conseguir disponibilizar o servidor MCP, o turno falha
antes de a thread começar.

Sessões existentes mantêm seu runtime e vínculo de thread do Codex. Depois de alterar
`agentRuntime` ou a configuração do Computer Use, use `/new` ou `/reset` no chat
afetado antes de testar.

## Comandos

Use os comandos `/codex computer-use` de qualquer superfície de chat em que a superfície de comandos do Plugin `codex`
esteja disponível. Estes são comandos de chat/runtime do OpenClaw,
não subcomandos da CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` é somente leitura. Ele não adiciona fontes de marketplace, instala Plugins nem
habilita suporte a Plugin do Codex.

`install` habilita o suporte a Plugin do app-server do Codex, opcionalmente adiciona uma
fonte de marketplace configurada, instala ou reabilita o Plugin configurado por meio do app-server
do Codex, recarrega servidores MCP e verifica se o servidor MCP expõe ferramentas.

## Opções de marketplace

O OpenClaw usa a mesma API do app-server que o próprio Codex expõe. Os
campos de marketplace escolhem onde o Codex deve encontrar `computer-use`.

| Campo                | Use quando                                                        | Suporte à instalação                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Nenhum campo de marketplace | Você quer que o app-server do Codex use marketplaces que ele já conhece. | Sim, quando o app-server retorna um marketplace local.        |
| `marketplaceSource`  | Você tem uma fonte de marketplace do Codex que o app-server pode adicionar.         | Sim, para `/codex computer-use install` explícito.         |
| `marketplacePath`    | Você já sabe o caminho do arquivo de marketplace local no host.   | Sim, para instalação explícita e instalação automática no início do turno.   |
| `marketplaceName`    | Você quer selecionar um marketplace já registrado pelo nome.  | Sim, somente quando o marketplace selecionado tem um caminho local. |

Homes novos do Codex podem precisar de um breve momento para semear seus marketplaces oficiais.
Durante a instalação, o OpenClaw consulta `plugin/list` por até
`marketplaceDiscoveryTimeoutMs` milissegundos. O padrão é 60 segundos.

Se vários marketplaces conhecidos contiverem Computer Use, o OpenClaw prefere
`openai-bundled`, depois `openai-curated`, depois `local`. Correspondências ambíguas desconhecidas
falham de forma fechada e pedem que você defina `marketplaceName` ou `marketplacePath`.

## Marketplace macOS incluído

Builds recentes do desktop Codex incluem o Computer Use aqui:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Quando `computerUse.autoInstall` é true e nenhum marketplace contendo
`computer-use` está registrado, o OpenClaw tenta adicionar automaticamente a raiz padrão do
marketplace incluído:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Você também pode registrá-la explicitamente em um shell com o Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Se você usa um caminho não padrão para o app Codex, defina `computerUse.marketplacePath` para um
caminho local de arquivo de marketplace ou execute `/codex computer-use install --source
<marketplace-source>` uma vez.

## Limite do catálogo remoto

O app-server do Codex pode listar e ler entradas de catálogo somente remotas, mas atualmente
não oferece suporte a `plugin/install` remoto. Isso significa que `marketplaceName` pode
selecionar um marketplace somente remoto para verificações de status, mas instalações e reabilitações
ainda precisam de um marketplace local por meio de `marketplaceSource` ou `marketplacePath`.

Se o status disser que o Plugin está disponível em um marketplace remoto do Codex, mas a instalação
remota não tem suporte, execute install com uma fonte ou caminho local:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Referência de configuração

| Campo                           | Padrão        | Significado                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferido       | Exige Computer Use. O padrão é true quando outro campo de Computer Use está definido. |
| `autoInstall`                   | false          | Instala ou reabilita a partir de marketplaces já descobertos no início do turno.       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Por quanto tempo a instalação espera pela descoberta de marketplace do app-server do Codex.             |
| `marketplaceSource`             | não definido          | String de fonte passada para `marketplace/add` do app-server do Codex.                    |
| `marketplacePath`               | não definido          | Caminho local do arquivo de marketplace do Codex contendo o Plugin.                       |
| `marketplaceName`               | não definido          | Nome do marketplace registrado do Codex a selecionar.                                   |
| `pluginName`                    | `computer-use` | Nome do Plugin no marketplace do Codex.                                                 |
| `mcpServerName`                 | `computer-use` | Nome do servidor MCP exposto pelo Plugin instalado.                               |

A instalação automática no início do turno recusa intencionalmente valores configurados de `marketplaceSource`.
Adicionar uma nova fonte é uma operação de configuração explícita, então use
`/codex computer-use install --source <marketplace-source>` uma vez, depois deixe
`autoInstall` cuidar de futuras reabilitações a partir de marketplaces locais descobertos.
A instalação automática no início do turno pode usar um `marketplacePath` configurado, porque isso
já é um caminho local no host.

## O que o OpenClaw verifica

O OpenClaw relata internamente um motivo de configuração estável e formata o status voltado ao usuário
para o chat:

| Motivo                       | Significado                                                | Próxima etapa                                     |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` foi resolvido como false.               | Defina `enabled` ou outro campo de Computer Use.  |
| `marketplace_missing`        | Nenhum marketplace correspondente estava disponível.                 | Configure fonte, caminho ou nome de marketplace.  |
| `plugin_not_installed`       | O marketplace existe, mas o Plugin não está instalado.   | Execute install ou habilite `autoInstall`.          |
| `plugin_disabled`            | O Plugin está instalado, mas desabilitado na configuração do Codex.      | Execute install para reabilitá-lo.                  |
| `remote_install_unsupported` | O marketplace selecionado é somente remoto.                   | Use `marketplaceSource` ou `marketplacePath`. |
| `mcp_missing`                | O Plugin está habilitado, mas o servidor MCP está indisponível.  | Verifique o Codex Computer Use e as permissões do SO.  |
| `ready`                      | O Plugin e as ferramentas MCP estão disponíveis.                    | Inicie o turno em modo Codex.                    |
| `check_failed`               | Uma solicitação ao app-server do Codex falhou durante a verificação de status. | Verifique a conectividade e os logs do app-server.       |
| `auto_install_blocked`       | A configuração no início do turno precisaria adicionar uma nova fonte.       | Execute a instalação explícita primeiro.                   |

A saída do chat inclui o estado do Plugin, o estado do servidor MCP, o marketplace, as ferramentas
quando disponíveis e a mensagem específica da etapa de configuração que falhou.

## Permissões do macOS

Computer Use é específico do macOS. O servidor MCP de responsabilidade do Codex pode precisar de permissões locais do SO
antes de poder inspecionar ou controlar apps. Se o OpenClaw disser que o Computer Use
está instalado, mas o servidor MCP está indisponível, verifique primeiro a configuração do Computer Use
no lado do Codex:

- O app-server do Codex está em execução no mesmo host onde o controle do desktop deve
  acontecer.
- O Plugin Computer Use está habilitado na configuração do Codex.
- O servidor MCP `computer-use` aparece no status de MCP do app-server do Codex.
- O macOS concedeu as permissões necessárias para o aplicativo de controle do desktop.
- A sessão atual do host consegue acessar o desktop sendo controlado.

O OpenClaw intencionalmente falha em modo fechado quando `computerUse.enabled` é true. Um
turno em modo Codex não deve prosseguir silenciosamente sem as ferramentas nativas de desktop
exigidas pela configuração.

## Solução de problemas

**O status diz que não está instalado.** Execute `/codex computer-use install`. Se a
loja não for descoberta, passe `--source` ou `--marketplace-path`.

**O status diz que está instalado, mas desabilitado.** Execute `/codex computer-use install` novamente.
A instalação pelo app-server do Codex grava a configuração do Plugin de volta como habilitada.

**O status diz que a instalação remota não é compatível.** Use uma fonte ou
caminho de loja local. Entradas de catálogo somente remotas podem ser inspecionadas, mas não instaladas pela
API atual do app-server.

**O status diz que o servidor MCP está indisponível.** Execute a instalação novamente uma vez para que os servidores MCP
sejam recarregados. Se ele continuar indisponível, corrija o aplicativo Codex Computer Use,
o status de MCP do app-server do Codex ou as permissões do macOS.

**O status ou uma sondagem expira em `computer-use.list_apps`.** O Plugin e o servidor MCP
estão presentes, mas a ponte local do Computer Use não respondeu. Encerre ou
reinicie o Codex Computer Use, reinicie o Codex Desktop se necessário e tente novamente em uma
nova sessão do OpenClaw.

**Uma ferramenta do Computer Use diz `Native hook relay unavailable`.** O hook de ferramenta nativo do Codex
não conseguiu alcançar um relay ativo do OpenClaw pela ponte local ou pelo fallback do
Gateway. Inicie uma nova sessão do OpenClaw com `/new` ou `/reset`. Se isso
continuar acontecendo, reinicie o gateway para que threads antigas do app-server e registros de hook
sejam descartados e tente novamente.

**A instalação automática no início do turno recusa uma fonte.** Isso é intencional. Adicione a
fonte com `/codex computer-use install --source <marketplace-source>` explícito
primeiro; então instalações automáticas futuras no início do turno poderão usar a loja local
descoberta.
