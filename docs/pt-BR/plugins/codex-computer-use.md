---
read_when:
    - Você quer que os agentes OpenClaw no modo Codex usem o Codex Computer Use
    - Você está decidindo entre Codex Computer Use, PeekabooBridge e o MCP cua-driver direto
    - Você está decidindo entre o Codex Computer Use e uma configuração direta de MCP com cua-driver
    - Você está configurando computerUse para o Plugin Codex incluído
    - Você está solucionando problemas de status ou instalação de /codex computer-use
summary: Configure o Codex Computer Use para agentes OpenClaw em modo Codex
title: Uso de computador do Codex
x-i18n:
    generated_at: "2026-04-30T09:58:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e3551b9005cdc8084d159c107f9b5039a4b4624847b8cc6e5bcb620510fd54f
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use é um plugin MCP nativo do Codex para controle do desktop local. O OpenClaw
não inclui o aplicativo de desktop, não executa ações de desktop por conta própria nem ignora
as permissões do Codex. O plugin `codex` incluído apenas prepara o Codex app-server:
ele habilita o suporte a plugins do Codex, encontra ou instala o plugin Codex
Computer Use configurado, verifica se o servidor MCP `computer-use` está disponível e
então deixa o Codex controlar as chamadas de ferramenta MCP nativas durante turnos em modo Codex.

Use esta página quando o OpenClaw já estiver usando o harness nativo do Codex. Para a
configuração do runtime em si, consulte [harness do Codex](/pt-BR/plugins/codex-harness).

## OpenClaw.app e Peekaboo

A integração do Peekaboo no OpenClaw.app é separada do Codex Computer Use. O
aplicativo macOS pode hospedar um socket PeekabooBridge para que a CLI `peekaboo` possa reutilizar as
permissões locais de Acessibilidade e Gravação de Tela do aplicativo para as próprias
ferramentas de automação do Peekaboo. Essa bridge não instala nem faz proxy do Codex Computer Use, e
o Codex Computer Use não chama por meio do socket PeekabooBridge.

Use [bridge do Peekaboo](/pt-BR/platforms/mac/peekaboo) quando quiser que o OpenClaw.app seja
um host ciente de permissões para automação da CLI do Peekaboo. Use esta página quando um
agente do OpenClaw em modo Codex precisar ter o plugin MCP `computer-use` nativo do Codex
disponível antes do início do turno.

## Aplicativo iOS

O aplicativo iOS é separado do Codex Computer Use. Ele não instala nem faz proxy do
servidor MCP `computer-use` do Codex e não é um backend de controle de desktop.
Em vez disso, o aplicativo iOS se conecta como um node do OpenClaw e expõe capacidades
móveis por meio de comandos de node como `canvas.*`, `camera.*`, `screen.*`,
`location.*` e `talk.*`.

Use [iOS](/pt-BR/platforms/ios) quando quiser que um agente controle um node iPhone por meio do
Gateway. Use esta página quando um agente em modo Codex precisar controlar o desktop
macOS local por meio do plugin nativo Computer Use do Codex.

## MCP direto do cua-driver

Codex Computer Use não é a única forma de expor controle de desktop. Se você quiser que
runtimes gerenciados pelo OpenClaw chamem diretamente o driver da TryCua, use o servidor
`cua-driver mcp` upstream por meio do registro MCP do OpenClaw em vez do fluxo de
marketplace específico do Codex.

Depois de instalar `cua-driver`, peça a ele o comando do OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

ou registre você mesmo o servidor stdio:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Esse caminho mantém intacta a superfície de ferramentas MCP upstream, incluindo os schemas
do driver e as respostas MCP estruturadas. Use-o quando quiser que o driver CUA
fique disponível como um servidor MCP normal do OpenClaw. Use a configuração do Codex Computer Use nesta
página quando o Codex app-server precisar controlar a instalação do plugin, recargas do MCP
e chamadas de ferramentas nativas dentro de turnos em modo Codex.

O driver CUA é específico para macOS e ainda exige as permissões locais do macOS
solicitadas pelo aplicativo, como Acessibilidade e Gravação de Tela. O OpenClaw
não instala `cua-driver`, não concede essas permissões nem ignora o modelo de segurança
do driver upstream.

## Configuração rápida

Defina `plugins.entries.codex.config.computerUse` quando turnos em modo Codex precisarem ter
Computer Use disponível antes do início de uma thread:

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
        fallback: "none",
      },
    },
  },
}
```

Com esta configuração, o OpenClaw verifica o Codex app-server antes de cada turno em modo Codex.
Se Computer Use estiver ausente, mas o Codex app-server já tiver descoberto um
marketplace instalável, o OpenClaw pede ao Codex app-server para instalar ou reabilitar
o plugin e recarregar os servidores MCP. No macOS, quando nenhum marketplace correspondente está
registrado e o pacote de aplicativo padrão do Codex existe, o OpenClaw também tenta
registrar o marketplace Codex incluído em
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` antes de
falhar. Se a configuração ainda não conseguir disponibilizar o servidor MCP, o turno falha
antes do início da thread.

Sessões existentes mantêm seu runtime e vínculo de thread do Codex. Depois de alterar
`agentRuntime` ou a configuração de Computer Use, use `/new` ou `/reset` no chat afetado
antes de testar.

## Comandos

Use os comandos `/codex computer-use` de qualquer superfície de chat onde a superfície de comandos do plugin
`codex` esteja disponível. Estes são comandos de chat/runtime do OpenClaw,
não subcomandos da CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` é somente leitura. Ele não adiciona fontes de marketplace, não instala plugins nem
habilita o suporte a plugins do Codex.

`install` habilita o suporte a plugins do Codex app-server, opcionalmente adiciona uma fonte de
marketplace configurada, instala ou reabilita o plugin configurado por meio do Codex
app-server, recarrega servidores MCP e verifica se o servidor MCP expõe ferramentas.

## Opções de marketplace

O OpenClaw usa a mesma API app-server que o próprio Codex expõe. Os
campos de marketplace escolhem onde o Codex deve encontrar `computer-use`.

| Campo                | Use quando                                                        | Suporte à instalação                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Nenhum campo de marketplace | Você quer que o Codex app-server use marketplaces que ele já conhece. | Sim, quando o app-server retorna um marketplace local.        |
| `marketplaceSource`  | Você tem uma fonte de marketplace do Codex que o app-server pode adicionar.         | Sim, para `/codex computer-use install` explícito.         |
| `marketplacePath`    | Você já sabe o caminho local do arquivo de marketplace no host.   | Sim, para instalação explícita e instalação automática no início do turno.   |
| `marketplaceName`    | Você quer selecionar um marketplace já registrado pelo nome.  | Sim, somente quando o marketplace selecionado tem um caminho local. |

Homes novos do Codex podem precisar de um breve momento para semear seus marketplaces oficiais.
Durante a instalação, o OpenClaw sonda `plugin/list` por até
`marketplaceDiscoveryTimeoutMs` milissegundos. O padrão é 60 segundos.

Se vários marketplaces conhecidos contiverem Computer Use, o OpenClaw prefere
`openai-bundled`, depois `openai-curated`, depois `local`. Correspondências ambíguas desconhecidas
falham de forma fechada e pedem que você defina `marketplaceName` ou `marketplacePath`.

## Marketplace macOS incluído

Builds recentes do desktop Codex incluem Computer Use aqui:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Quando `computerUse.autoInstall` é true e nenhum marketplace contendo
`computer-use` está registrado, o OpenClaw tenta adicionar automaticamente a raiz padrão do marketplace
incluído:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Você também pode registrá-la explicitamente a partir de um shell com o Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Se você usar um caminho de aplicativo Codex fora do padrão, defina `computerUse.marketplacePath` como um
caminho local de arquivo de marketplace ou execute `/codex computer-use install --source
<marketplace-source>` uma vez.

## Limite de catálogo remoto

O Codex app-server pode listar e ler entradas de catálogo somente remotas, mas atualmente não
oferece suporte a `plugin/install` remoto. Isso significa que `marketplaceName` pode
selecionar um marketplace somente remoto para verificações de status, mas instalações e reabilitações
ainda precisam de um marketplace local via `marketplaceSource` ou `marketplacePath`.

Se o status disser que o plugin está disponível em um marketplace remoto do Codex, mas a instalação
remota não tem suporte, execute a instalação com uma fonte ou caminho local:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Referência de configuração

| Campo                           | Padrão        | Significado                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferido       | Exige Computer Use. O padrão é true quando outro campo de Computer Use é definido. |
| `autoInstall`                   | false          | Instala ou reabilita a partir de marketplaces já descobertos no início do turno.       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Por quanto tempo a instalação aguarda a descoberta de marketplace pelo Codex app-server.             |
| `marketplaceSource`             | não definido          | String de origem passada para `marketplace/add` do Codex app-server.                    |
| `marketplacePath`               | não definido          | Caminho local do arquivo de marketplace do Codex contendo o plugin.                       |
| `marketplaceName`               | não definido          | Nome do marketplace registrado do Codex a selecionar.                                   |
| `pluginName`                    | `computer-use` | Nome do plugin no marketplace do Codex.                                                 |
| `mcpServerName`                 | `computer-use` | Nome do servidor MCP exposto pelo plugin instalado.                               |

A instalação automática no início do turno recusa intencionalmente valores configurados de `marketplaceSource`.
Adicionar uma nova fonte é uma operação de configuração explícita, então use
`/codex computer-use install --source <marketplace-source>` uma vez e depois deixe
`autoInstall` cuidar de reabilitações futuras a partir de marketplaces locais descobertos.
A instalação automática no início do turno pode usar um `marketplacePath` configurado, porque ele já é
um caminho local no host.

## O que o OpenClaw verifica

O OpenClaw relata internamente um motivo de configuração estável e formata o status voltado ao usuário
para o chat:

| Motivo                       | Significado                                                | Próximo passo                                     |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` foi resolvido como false.               | Defina `enabled` ou outro campo de Computer Use.  |
| `marketplace_missing`        | Nenhum marketplace correspondente estava disponível.                 | Configure a fonte, o caminho ou o nome do marketplace.  |
| `plugin_not_installed`       | O marketplace existe, mas o plugin não está instalado.   | Execute install ou habilite `autoInstall`.          |
| `plugin_disabled`            | O plugin está instalado, mas desabilitado na configuração do Codex.      | Execute install para reabilitá-lo.                  |
| `remote_install_unsupported` | O marketplace selecionado é somente remoto.                   | Use `marketplaceSource` ou `marketplacePath`. |
| `mcp_missing`                | O plugin está habilitado, mas o servidor MCP está indisponível.  | Verifique o Codex Computer Use e as permissões do SO.  |
| `ready`                      | O plugin e as ferramentas MCP estão disponíveis.                    | Inicie o turno em modo Codex.                    |
| `check_failed`               | Uma solicitação ao Codex app-server falhou durante a verificação de status. | Verifique a conectividade e os logs do app-server.       |
| `auto_install_blocked`       | A configuração no início do turno precisaria adicionar uma nova fonte.       | Execute a instalação explícita primeiro.                   |

A saída do chat inclui o estado do plugin, o estado do servidor MCP, o marketplace, ferramentas
quando disponíveis e a mensagem específica da etapa de configuração com falha.

## Permissões do macOS

Computer Use é específico para macOS. O servidor MCP controlado pelo Codex pode precisar de permissões locais do SO
antes de conseguir inspecionar ou controlar aplicativos. Se o OpenClaw disser que Computer Use
está instalado, mas o servidor MCP está indisponível, verifique primeiro a configuração de Computer
Use no lado do Codex:

- O app-server do Codex está em execução no mesmo host onde o controle de desktop deve
  ocorrer.
- O Plugin Computer Use está habilitado na configuração do Codex.
- O servidor MCP `computer-use` aparece no status MCP do app-server do Codex.
- O macOS concedeu as permissões necessárias para o app de controle de desktop.
- A sessão atual do host consegue acessar o desktop que está sendo controlado.

O OpenClaw falha intencionalmente de forma fechada quando `computerUse.enabled` é true. Uma
rodada em modo Codex não deve prosseguir silenciosamente sem as ferramentas nativas de desktop
exigidas pela configuração.

## Solução de problemas

**O status diz que não está instalado.** Execute `/codex computer-use install`. Se o
marketplace não for descoberto, passe `--source` ou `--marketplace-path`.

**O status diz que está instalado, mas desabilitado.** Execute `/codex computer-use install` novamente.
A instalação do app-server do Codex grava a configuração do Plugin de volta como habilitada.

**O status diz que a instalação remota não é compatível.** Use uma fonte ou
caminho de marketplace local. Entradas de catálogo somente remotas podem ser inspecionadas, mas não instaladas por meio da
API atual do app-server.

**O status diz que o servidor MCP está indisponível.** Execute a instalação novamente uma vez para que os
servidores MCP sejam recarregados. Se continuar indisponível, corrija o app Codex Computer Use,
o status MCP do app-server do Codex ou as permissões do macOS.

**O status ou uma sondagem atinge o tempo limite em `computer-use.list_apps`.** O Plugin e o servidor MCP
estão presentes, mas a ponte local do Computer Use não respondeu. Encerre ou
reinicie o Codex Computer Use, reinicie o Codex Desktop se necessário e tente novamente em uma
nova sessão do OpenClaw.

**Uma ferramenta do Computer Use diz `Native hook relay unavailable`.** O hook nativo do Codex
não conseguiu alcançar um relay ativo do OpenClaw pela ponte local ou pelo
fallback do Gateway. Inicie uma nova sessão do OpenClaw com `/new` ou `/reset`. Se isso
continuar acontecendo, reinicie o gateway para que threads antigas do app-server e registros de hook
sejam descartados e tente novamente.

**A instalação automática no início da rodada recusa uma fonte.** Isso é intencional. Adicione a
fonte explicitamente com `/codex computer-use install --source <marketplace-source>`
primeiro; então a instalação automática no início de rodadas futuras poderá usar o
marketplace local descoberto.
