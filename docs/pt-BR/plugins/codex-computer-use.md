---
read_when:
    - Você quer que agentes OpenClaw no modo Codex usem o Codex Computer Use
    - Você está escolhendo entre Codex Computer Use, PeekabooBridge e MCP direto do cua-driver
    - Você está decidindo entre o Codex Computer Use e uma configuração direta de MCP com cua-driver
    - Você está configurando computerUse para o Plugin Codex incluído
    - Você está solucionando problemas de status ou instalação de uso do computador do /codex
summary: Configure o Codex Computer Use para agentes OpenClaw em modo Codex
title: Uso de Computador do Codex
x-i18n:
    generated_at: "2026-06-27T17:45:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a595b8ae261c1cc9a1469217a31279cd3a116b0f11c16813ea018aab76b8c0d
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use é um plugin MCP nativo do Codex para controle local de desktop. O OpenClaw
não incorpora o aplicativo desktop, não executa ações de desktop por conta própria nem ignora
as permissões do Codex. O plugin `codex` incluído apenas prepara o Codex app-server:
ele habilita o suporte a plugins do Codex, encontra ou instala o plugin Codex
Computer Use configurado, verifica se o servidor MCP `computer-use` está disponível e
então deixa o Codex controlar as chamadas nativas de ferramenta MCP durante turnos em modo Codex.

Use esta página quando o OpenClaw já estiver usando o harness nativo do Codex. Para a
configuração do runtime em si, consulte [harness do Codex](/pt-BR/plugins/codex-harness).

## OpenClaw.app e Peekaboo

A integração Peekaboo do OpenClaw.app é separada do Codex Computer Use. O
aplicativo macOS pode hospedar um socket PeekabooBridge para que a CLI `peekaboo` possa reutilizar as
permissões locais de Acessibilidade e Gravação de Tela do aplicativo para as próprias
ferramentas de automação do Peekaboo. Essa bridge não instala nem faz proxy do Codex Computer Use, e
o Codex Computer Use não chama por meio do socket PeekabooBridge.

Use [bridge do Peekaboo](/pt-BR/platforms/mac/peekaboo) quando quiser que o OpenClaw.app seja
um host ciente de permissões para automação pela CLI Peekaboo. Use esta página quando um
agente OpenClaw em modo Codex deve ter o plugin MCP `computer-use` nativo do Codex
disponível antes do início do turno.

## Aplicativo iOS

O aplicativo iOS é separado do Codex Computer Use. Ele não instala nem faz proxy
do servidor MCP `computer-use` do Codex e não é um backend de controle de desktop.
Em vez disso, o aplicativo iOS se conecta como um nó OpenClaw e expõe capacidades
móveis por meio de comandos de nó, como `canvas.*`, `camera.*`, `screen.*`,
`location.*` e `talk.*`.

Use [iOS](/pt-BR/platforms/ios) quando quiser que um agente controle um nó iPhone por meio
do gateway. Use esta página quando um agente em modo Codex deve controlar o desktop
macOS local por meio do plugin Computer Use nativo do Codex.

## MCP direto do cua-driver

O Codex Computer Use não é a única forma de expor controle de desktop. Se você quiser
que runtimes gerenciados pelo OpenClaw chamem o driver da TryCua diretamente, use o servidor
upstream `cua-driver mcp` por meio do registro MCP do OpenClaw em vez do
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
esteja disponível como um servidor MCP normal do OpenClaw. Use a configuração do Codex Computer Use
nesta página quando o Codex app-server deve controlar a instalação do plugin, recarregamentos MCP
e chamadas nativas de ferramenta dentro de turnos em modo Codex.

O driver da CUA é específico do macOS e ainda exige as permissões locais do macOS
que o aplicativo solicita, como Acessibilidade e Gravação de Tela. O OpenClaw
não instala `cua-driver`, não concede essas permissões nem ignora o modelo de segurança
do driver upstream.

## Configuração rápida

Defina `plugins.entries.codex.config.computerUse` quando turnos em modo Codex precisarem ter
Computer Use disponível antes que uma thread comece. `autoInstall: true` opta por
Computer Use e permite que o OpenClaw o instale ou reabilite antes do turno:

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
    },
  },
}
```

Com esta configuração, o OpenClaw verifica o Codex app-server antes de cada turno em modo Codex.
Se o Computer Use estiver ausente, mas o Codex app-server já tiver descoberto um
marketplace instalável, o OpenClaw pede ao Codex app-server para instalar ou reabilitar
o plugin e recarregar os servidores MCP. No macOS, quando nenhum marketplace correspondente está
registrado e o pacote padrão do aplicativo Codex existe, o OpenClaw também tenta
registrar o marketplace Codex incluído de
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` antes de
falhar. Se a configuração ainda não conseguir disponibilizar o servidor MCP, o turno falha
antes que a thread comece.

Depois de alterar a configuração do Computer Use, use `/new` ou `/reset` no chat afetado
antes de testar se uma thread Codex existente já tiver começado.

Na inicialização stdio gerenciada no macOS, o OpenClaw prefere o pacote assinado do aplicativo desktop Codex
em `/Applications/Codex.app/Contents/Resources/codex` quando ele existe.
Isso mantém o Computer Use sob o pacote do aplicativo que controla as permissões locais de
controle de desktop. Se o aplicativo desktop não estiver instalado, o OpenClaw recorre ao
binário Codex gerenciado instalado ao lado do plugin. Se um aplicativo desktop instalado
inicializar com uma versão de app-server incompatível, o OpenClaw fecha esse processo filho
e tenta o próximo candidato de binário gerenciado em vez de permitir que um
aplicativo desktop desatualizado oculte o fallback local do plugin. A configuração explícita de
`appServer.command` ou `OPENCLAW_CODEX_APP_SERVER_BIN` ainda substitui essa seleção
gerenciada.

## Comandos

Use os comandos `/codex computer-use` a partir de qualquer superfície de chat em que a superfície de comandos do plugin `codex`
esteja disponível. Estes são comandos de chat/runtime do OpenClaw,
não subcomandos da CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` é somente leitura. Ele não adiciona fontes de marketplace, instala plugins nem
habilita o suporte a plugins do Codex. Se nenhuma configuração optar por Computer Use, `status` pode
relatar desabilitado mesmo após um comando de instalação avulso.

`install` habilita o suporte a plugins do Codex app-server, opcionalmente adiciona uma fonte de
marketplace configurada, instala ou reabilita o plugin configurado por meio do Codex
app-server, recarrega servidores MCP e verifica se o servidor MCP expõe ferramentas.

## Opções de marketplace

O OpenClaw usa a mesma API de app-server que o próprio Codex expõe. Os
campos de marketplace escolhem onde o Codex deve encontrar `computer-use`.

| Campo                | Use quando                                                        | Suporte à instalação                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Sem campo de marketplace | Você quer que o Codex app-server use marketplaces que ele já conhece. | Sim, quando o app-server retorna um marketplace local.        |
| `marketplaceSource`  | Você tem uma fonte de marketplace Codex que o app-server pode adicionar.         | Sim, para `/codex computer-use install` explícito.         |
| `marketplacePath`    | Você já sabe o caminho local do arquivo de marketplace no host.   | Sim, para instalação explícita e instalação automática no início do turno.   |
| `marketplaceName`    | Você quer selecionar um marketplace já registrado por nome.  | Sim, somente quando o marketplace selecionado tem um caminho local. |

Homes Codex novos podem precisar de um breve momento para semear seus marketplaces oficiais.
Durante a instalação, o OpenClaw consulta `plugin/list` por até
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
`computer-use` está registrado, o OpenClaw tenta adicionar automaticamente a raiz padrão do
marketplace incluído:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Você também pode registrá-lo explicitamente a partir de um shell com Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Se você usa um caminho não padrão para o aplicativo Codex, execute `/codex computer-use install
--source <marketplace-root>` uma vez ou defina `computerUse.marketplacePath` para um
caminho local de arquivo de marketplace. Use `--marketplace-path` somente quando tiver o
caminho do arquivo JSON do marketplace, não a raiz do marketplace incluído.

## Limite do catálogo remoto

O Codex app-server pode listar e ler entradas de catálogo somente remotas, mas atualmente não
oferece suporte a `plugin/install` remoto. Isso significa que `marketplaceName` pode
selecionar um marketplace somente remoto para verificações de status, mas instalações e reabilitações
ainda precisam de um marketplace local por meio de `marketplaceSource` ou `marketplacePath`.

Se o status disser que o plugin está disponível em um marketplace Codex remoto, mas a instalação
remota não for compatível, execute a instalação com uma fonte ou caminho local:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Referência de configuração

| Campo                           | Padrão        | Significado                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Exigir Computer Use. O padrão é true quando outro campo de Computer Use está definido. |
| `autoInstall`                   | false          | Instalar ou reabilitar a partir de marketplaces já descobertos no início do turno.       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Por quanto tempo a instalação aguarda a descoberta de marketplaces pelo Codex app-server.             |
| `marketplaceSource`             | unset          | String de origem passada para `marketplace/add` do Codex app-server.                    |
| `marketplacePath`               | unset          | Caminho local do arquivo de marketplace Codex que contém o plugin.                       |
| `marketplaceName`               | unset          | Nome do marketplace Codex registrado a selecionar.                                   |
| `pluginName`                    | `computer-use` | Nome do plugin no marketplace Codex.                                                 |
| `mcpServerName`                 | `computer-use` | Nome do servidor MCP exposto pelo plugin instalado.                               |

A instalação automática no início do turno recusa intencionalmente valores configurados de `marketplaceSource`.
Adicionar uma nova fonte é uma operação explícita de configuração, então use
`/codex computer-use install --source <marketplace-source>` uma vez e depois deixe
`autoInstall` cuidar de futuras reabilitações a partir de marketplaces locais descobertos.
A instalação automática no início do turno pode usar um `marketplacePath` configurado, porque esse já é
um caminho local no host.

## O que o OpenClaw verifica

O OpenClaw relata internamente um motivo de configuração estável e formata o status voltado ao usuário
para o chat:

| Motivo                       | Significado                                            | Próxima etapa                                 |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` foi resolvido como falso.        | Defina `enabled` ou outro campo de Computer Use. |
| `marketplace_missing`        | Nenhum marketplace correspondente estava disponível.   | Configure a origem, o caminho ou o nome do marketplace. |
| `plugin_not_installed`       | O marketplace existe, mas o plugin não está instalado. | Execute a instalação ou habilite `autoInstall`. |
| `plugin_disabled`            | O Plugin está instalado, mas desabilitado na configuração do Codex. | Execute a instalação para reabilitá-lo. |
| `remote_install_unsupported` | O marketplace selecionado é somente remoto.            | Use `marketplaceSource` ou `marketplacePath`. |
| `mcp_missing`                | O Plugin está habilitado, mas o servidor MCP está indisponível. | Verifique o Codex Computer Use e as permissões do SO. |
| `ready`                      | O Plugin e as ferramentas MCP estão disponíveis.       | Inicie o turno em modo Codex.                 |
| `check_failed`               | Uma solicitação ao app-server do Codex falhou durante a verificação de status. | Verifique a conectividade e os logs do app-server. |
| `auto_install_blocked`       | A configuração no início do turno precisaria adicionar uma nova origem. | Execute a instalação explícita primeiro.      |

A saída do chat inclui o estado do plugin, o estado do servidor MCP, o marketplace, as ferramentas
quando disponíveis e a mensagem específica da etapa de configuração que falhou.

## Permissões do macOS

Computer Use é específico do macOS. O servidor MCP pertencente ao Codex pode precisar de
permissões locais do SO antes de conseguir inspecionar ou controlar apps. Se o OpenClaw disser que Computer Use
está instalado, mas o servidor MCP está indisponível, verifique primeiro a configuração de Computer
Use no lado do Codex:

- O app-server do Codex está em execução no mesmo host onde o controle do desktop deve
  acontecer.
- O plugin Computer Use está habilitado na configuração do Codex.
- O servidor MCP `computer-use` aparece no status MCP do app-server do Codex.
- O macOS concedeu as permissões necessárias para o app de controle do desktop.
- A sessão atual do host consegue acessar o desktop que está sendo controlado.

O OpenClaw falha de forma fechada intencionalmente quando `computerUse.enabled` é verdadeiro. Um
turno em modo Codex não deve prosseguir silenciosamente sem as ferramentas nativas de desktop
exigidas pela configuração.

## Solução de problemas

**O status diz que não está instalado.** Execute `/codex computer-use install`. Se o
marketplace não for descoberto, passe `--source` ou `--marketplace-path`.

**O status diz que está instalado, mas desabilitado.** Execute `/codex computer-use install` novamente.
A instalação do app-server do Codex grava a configuração do plugin de volta como habilitada.

**O status diz que a instalação remota não é compatível.** Use uma origem ou
caminho de marketplace local. Entradas de catálogo somente remotas podem ser inspecionadas, mas não instaladas pela
API atual do app-server.

**O status diz que o servidor MCP está indisponível.** Execute a instalação novamente uma vez para que os servidores MCP
sejam recarregados. Se ele continuar indisponível, corrija o app Codex Computer Use,
o status MCP do app-server do Codex ou as permissões do macOS.

**O status ou uma sondagem expira em `computer-use.list_apps`.** O plugin e o servidor MCP
estão presentes, mas a ponte local do Computer Use não respondeu. Encerre ou
reinicie o Codex Computer Use, reinicie o Codex Desktop se necessário e tente novamente em uma
nova sessão do OpenClaw. Se o host já executou o Computer Use por meio de um app-server do Codex gerenciado
mais antigo, atualize o plugin instalado a partir do marketplace empacotado no desktop:

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**Uma ferramenta de Computer Use diz `Native hook relay unavailable`.** O hook nativo do Codex
não conseguiu alcançar um relay ativo do OpenClaw pela ponte local ou pelo fallback do
Gateway. Inicie uma nova sessão do OpenClaw com `/new` ou `/reset`. Se
funcionar uma vez e falhar novamente em uma chamada de ferramenta posterior, `/new` está apenas limpando a
tentativa atual; reinicie o app-server do Codex ou o OpenClaw Gateway para que threads antigas
e registros de hook sejam descartados, então tente novamente em uma nova sessão.

**A instalação automática no início do turno recusa uma origem.** Isso é intencional. Adicione a
origem com `/codex computer-use install --source <marketplace-source>` explícito
primeiro; então futuras instalações automáticas no início do turno poderão usar o
marketplace local descoberto.

## Relacionados

- [Harness Codex](/pt-BR/plugins/codex-harness)
- [Ponte Peekaboo](/pt-BR/platforms/mac/peekaboo)
- [App iOS](/pt-BR/platforms/ios)
