---
read_when:
    - Você quer que agentes OpenClaw no modo Codex usem o Codex Computer Use
    - Você está decidindo entre Codex Computer Use, PeekabooBridge e o MCP cua-driver direto
    - Você está decidindo entre o Codex Computer Use e uma configuração MCP direta com cua-driver
    - Você está configurando computerUse para o plugin Codex incluído
    - Você está solucionando problemas de status ou instalação de uso do computador do /codex
summary: Configurar o Uso do Computador do Codex para agentes OpenClaw em modo Codex
title: Uso do computador do Codex
x-i18n:
    generated_at: "2026-06-30T13:53:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb785e2fda0d89a7e7770df0c2a4b3aa23f97cb1c8515a7d555a8409acfd3b2
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use é um Plugin MCP nativo do Codex para controle do desktop local. O OpenClaw
não incorpora o aplicativo de desktop, não executa ações de desktop por conta própria nem contorna
as permissões do Codex. O Plugin `codex` incluído apenas prepara o app-server do Codex:
ele habilita o suporte a Plugins do Codex, encontra ou instala o Plugin Codex
Computer Use configurado, verifica se o servidor MCP `computer-use` está disponível e
então deixa o Codex controlar as chamadas nativas de ferramenta MCP durante turnos em modo Codex.

Use esta página quando o OpenClaw já estiver usando o harness nativo do Codex. Para a
configuração do runtime em si, consulte [harness do Codex](/pt-BR/plugins/codex-harness).

## OpenClaw.app e Peekaboo

A integração Peekaboo do OpenClaw.app é separada do Codex Computer Use. O
aplicativo macOS pode hospedar um soquete PeekabooBridge para que a CLI `peekaboo` possa reutilizar as
permissões locais de Acessibilidade e Gravação de Tela do aplicativo para as próprias
ferramentas de automação do Peekaboo. Essa ponte não instala nem faz proxy do Codex Computer Use, e
o Codex Computer Use não chama através do soquete PeekabooBridge.

Use [ponte Peekaboo](/pt-BR/platforms/mac/peekaboo) quando quiser que o OpenClaw.app seja
um host ciente de permissões para automação da CLI Peekaboo. Use esta página quando um
agente OpenClaw em modo Codex precisar ter o Plugin MCP `computer-use` nativo do Codex
disponível antes do início do turno.

## Aplicativo iOS

O aplicativo iOS é separado do Codex Computer Use. Ele não instala nem faz proxy
do servidor MCP `computer-use` do Codex e não é um backend de controle de desktop.
Em vez disso, o aplicativo iOS se conecta como um nó do OpenClaw e expõe
capacidades móveis por meio de comandos de nó como `canvas.*`, `camera.*`, `screen.*`,
`location.*` e `talk.*`.

Use [iOS](/pt-BR/platforms/ios) quando quiser que um agente controle um nó iPhone pelo
Gateway. Use esta página quando um agente em modo Codex precisar controlar o desktop
macOS local pelo Plugin Computer Use nativo do Codex.

## MCP direto do cua-driver

Codex Computer Use não é a única forma de expor controle de desktop. Se você quiser
que runtimes gerenciados pelo OpenClaw chamem o driver da TryCua diretamente, use o servidor
upstream `cua-driver mcp` pelo registro MCP do OpenClaw em vez do fluxo de marketplace
específico do Codex.

Depois de instalar `cua-driver`, peça a ele o comando do OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

ou registre o servidor stdio por conta própria:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Esse caminho mantém a superfície de ferramentas MCP upstream intacta, incluindo os esquemas
do driver e respostas MCP estruturadas. Use-o quando quiser que o driver CUA
esteja disponível como um servidor MCP normal do OpenClaw. Use a configuração do Codex Computer Use
nesta página quando o app-server do Codex precisar controlar a instalação do Plugin, recarregamentos de MCP
e chamadas nativas de ferramenta dentro de turnos em modo Codex.

O driver da CUA é específico do macOS e ainda exige as permissões locais do macOS
solicitadas pelo aplicativo, como Acessibilidade e Gravação de Tela. O OpenClaw
não instala `cua-driver`, não concede essas permissões nem contorna o modelo de segurança
do driver upstream.

## Configuração rápida

Defina `plugins.entries.codex.config.computerUse` quando turnos em modo Codex precisarem ter
Computer Use disponível antes de uma conversa começar. `autoInstall: true` opta pelo
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

Com esta configuração, o OpenClaw verifica o app-server do Codex antes de cada turno em modo Codex.
Se o Computer Use estiver ausente, mas o app-server do Codex já tiver descoberto um
marketplace instalável, o OpenClaw pede ao app-server do Codex para instalar ou reabilitar
o Plugin e recarregar os servidores MCP. No macOS, quando nenhum marketplace correspondente está
registrado e o pacote padrão do aplicativo Codex existe, o OpenClaw também tenta
registrar o marketplace Codex incluído de
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` antes de
falhar. Se a configuração ainda não conseguir tornar o servidor MCP disponível, o turno falha
antes que a conversa comece.

Depois de alterar a configuração do Computer Use, use `/new` ou `/reset` no chat afetado
antes de testar, se uma conversa existente do Codex já tiver começado.

Na inicialização stdio gerenciada no macOS, o OpenClaw prefere o pacote assinado do aplicativo Codex
de desktop em `/Applications/Codex.app/Contents/Resources/codex` quando ele existe.
Isso mantém o Computer Use sob o pacote do aplicativo que controla as permissões locais
de controle de desktop. Se o aplicativo de desktop não estiver instalado, o OpenClaw recorre ao
binário gerenciado do Codex instalado junto ao Plugin. Se um aplicativo de desktop instalado
inicializar com uma versão de app-server incompatível, o OpenClaw fecha esse processo filho
e tenta o próximo candidato a binário gerenciado, em vez de deixar um aplicativo de desktop
obsoleto ofuscar o fallback local do Plugin. A configuração explícita `appServer.command`
ou `OPENCLAW_CODEX_APP_SERVER_BIN` ainda substitui essa seleção gerenciada.

## Comandos

Use os comandos `/codex computer-use` a partir de qualquer superfície de chat onde a superfície de comandos do Plugin `codex`
esteja disponível. Estes são comandos de chat/runtime do OpenClaw,
não subcomandos da CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` é somente leitura. Ele não adiciona origens de marketplace, instala Plugins nem
habilita suporte a Plugins do Codex. Se nenhuma configuração optar pelo Computer Use, `status` pode
relatar desabilitado mesmo após um comando de instalação avulso.

`install` habilita o suporte a Plugins no app-server do Codex, opcionalmente adiciona uma
origem de marketplace configurada, instala ou reabilita o Plugin configurado pelo app-server
do Codex, recarrega servidores MCP e verifica se o servidor MCP expõe ferramentas.
Como a instalação altera recursos confiáveis do host, somente um proprietário ou um cliente
Gateway `operator.admin` pode executar `install`. Outros remetentes autorizados podem
continuar usando o comando `status` somente leitura, inclusive com substituições.

## Opções de marketplace

O OpenClaw usa a mesma API de app-server que o próprio Codex expõe. Os
campos de marketplace escolhem onde o Codex deve encontrar `computer-use`.

| Campo                | Use quando                                                        | Suporte à instalação                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Nenhum campo de marketplace | Você quer que o app-server do Codex use marketplaces que ele já conhece. | Sim, quando o app-server retorna um marketplace local.        |
| `marketplaceSource`  | Você tem uma origem de marketplace do Codex que o app-server pode adicionar.         | Sim, para `/codex computer-use install` explícito.         |
| `marketplacePath`    | Você já sabe o caminho de arquivo do marketplace local no host.   | Sim, para instalação explícita e instalação automática no início do turno.   |
| `marketplaceName`    | Você quer selecionar um marketplace já registrado pelo nome.  | Sim somente quando o marketplace selecionado tem um caminho local. |

Homes novos do Codex podem precisar de um breve momento para semear seus marketplaces oficiais.
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
`computer-use` está registrado, o OpenClaw tenta adicionar automaticamente a raiz padrão
do marketplace incluído:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Você também pode registrá-la explicitamente a partir de um shell com o Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Se você usar um caminho não padrão para o aplicativo Codex, execute `/codex computer-use install
--source <marketplace-root>` uma vez ou defina `computerUse.marketplacePath` como um
caminho de arquivo de marketplace local. Use `--marketplace-path` somente quando tiver o
caminho do arquivo JSON do marketplace, não a raiz do marketplace incluído.

## Limite do catálogo remoto

O app-server do Codex pode listar e ler entradas de catálogo somente remotas, mas atualmente não
oferece suporte a `plugin/install` remoto. Isso significa que `marketplaceName` pode
selecionar um marketplace somente remoto para verificações de status, mas instalações e reabilitações
ainda precisam de um marketplace local via `marketplaceSource` ou `marketplacePath`.

Se o status disser que o Plugin está disponível em um marketplace remoto do Codex, mas a
instalação remota não for compatível, execute a instalação com uma origem ou caminho local:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Referência de configuração

| Campo                           | Padrão        | Significado                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferido       | Exige Computer Use. O padrão é true quando outro campo de Computer Use está definido. |
| `autoInstall`                   | false          | Instala ou reabilita a partir de marketplaces já descobertos no início do turno.       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Por quanto tempo a instalação aguarda a descoberta de marketplace pelo app-server do Codex.             |
| `marketplaceSource`             | não definido          | String de origem passada para `marketplace/add` do app-server do Codex.                    |
| `marketplacePath`               | não definido          | Caminho de arquivo de marketplace local do Codex que contém o Plugin.                       |
| `marketplaceName`               | não definido          | Nome do marketplace registrado do Codex a selecionar.                                   |
| `pluginName`                    | `computer-use` | Nome do Plugin no marketplace do Codex.                                                 |
| `mcpServerName`                 | `computer-use` | Nome do servidor MCP exposto pelo Plugin instalado.                               |

A instalação automática no início do turno recusa intencionalmente valores configurados de `marketplaceSource`.
Adicionar uma nova origem é uma operação de configuração explícita, portanto use
`/codex computer-use install --source <marketplace-source>` uma vez, depois deixe
`autoInstall` lidar com futuras reabilitações a partir de marketplaces locais descobertos.
A instalação automática no início do turno pode usar um `marketplacePath` configurado, porque ele já é
um caminho local no host.

## O que o OpenClaw verifica

O OpenClaw relata internamente um motivo de configuração estável e formata o status voltado ao usuário
para o chat:

| Motivo                       | Significado                                            | Próxima etapa                                  |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` foi resolvido como false.        | Defina `enabled` ou outro campo de Computer Use. |
| `marketplace_missing`        | Nenhum marketplace correspondente estava disponível.   | Configure origem, caminho ou nome do marketplace. |
| `plugin_not_installed`       | O marketplace existe, mas o plugin não está instalado. | Execute a instalação ou habilite `autoInstall`. |
| `plugin_disabled`            | O Plugin está instalado, mas desabilitado na configuração do Codex. | Execute a instalação para reabilitá-lo. |
| `remote_install_unsupported` | O marketplace selecionado é somente remoto.            | Use `marketplaceSource` ou `marketplacePath`. |
| `mcp_missing`                | O Plugin está habilitado, mas o servidor MCP está indisponível. | Verifique o Codex Computer Use e as permissões do SO. |
| `ready`                      | O Plugin e as ferramentas MCP estão disponíveis.       | Inicie a rodada em modo Codex.                |
| `check_failed`               | Uma solicitação ao app-server do Codex falhou durante a verificação de status. | Verifique a conectividade e os logs do app-server. |
| `auto_install_blocked`       | A configuração no início da rodada precisaria adicionar uma nova origem. | Execute a instalação explícita primeiro.      |

A saída do chat inclui o estado do plugin, o estado do servidor MCP, o marketplace, as ferramentas
quando disponíveis e a mensagem específica da etapa de configuração com falha.

## Permissões do macOS

Computer Use é específico do macOS. O servidor MCP pertencente ao Codex pode precisar de permissões locais do SO
antes de conseguir inspecionar ou controlar aplicativos. Se o OpenClaw disser que Computer Use
está instalado, mas o servidor MCP está indisponível, verifique primeiro a configuração de Computer
Use no lado do Codex:

- O app-server do Codex está em execução no mesmo host em que o controle da área de trabalho deve
  acontecer.
- O Plugin Computer Use está habilitado na configuração do Codex.
- O servidor MCP `computer-use` aparece no status de MCP do app-server do Codex.
- O macOS concedeu as permissões exigidas para o aplicativo de controle da área de trabalho.
- A sessão atual do host consegue acessar a área de trabalho sendo controlada.

O OpenClaw falha de forma fechada intencionalmente quando `computerUse.enabled` é true. Uma
rodada em modo Codex não deve prosseguir silenciosamente sem as ferramentas nativas de área de trabalho
que a configuração exigiu.

## Solução de problemas

**O status diz que não está instalado.** Execute `/codex computer-use install`. Se o
marketplace não for descoberto, passe `--source` ou `--marketplace-path`.

**O status diz que está instalado, mas desabilitado.** Execute `/codex computer-use install` novamente.
A instalação pelo app-server do Codex grava a configuração do plugin de volta como habilitada.

**O status diz que instalação remota não é compatível.** Use uma origem ou
caminho de marketplace local. Entradas de catálogo somente remotas podem ser inspecionadas, mas não instaladas por meio da
API atual do app-server.

**O status diz que o servidor MCP está indisponível.** Execute a instalação novamente uma vez para que os servidores MCP
sejam recarregados. Se ele continuar indisponível, corrija o aplicativo Codex Computer Use,
o status de MCP do app-server do Codex ou as permissões do macOS.

**O status ou uma sondagem expira em `computer-use.list_apps`.** O Plugin e o servidor MCP
estão presentes, mas a ponte local do Computer Use não respondeu. Encerre ou
reinicie o Codex Computer Use, reinicie o Codex Desktop se necessário e tente novamente em uma
sessão nova do OpenClaw. Se o host anteriormente executou Computer Use por meio de um app-server do Codex gerenciado
mais antigo, atualize o plugin instalado a partir do marketplace empacotado no desktop:

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**Uma ferramenta de Computer Use diz `Native hook relay unavailable`.** O hook de ferramenta nativo do Codex
não conseguiu alcançar um relay ativo do OpenClaw pela ponte local ou pelo fallback do
Gateway. Inicie uma sessão nova do OpenClaw com `/new` ou `/reset`. Se funcionar
uma vez e depois falhar novamente em uma chamada de ferramenta posterior, `/new` está apenas limpando a
tentativa atual; reinicie o app-server do Codex ou o Gateway do OpenClaw para que threads
antigas e registros de hook sejam descartados, e então tente novamente em uma sessão nova.

**A instalação automática no início da rodada recusa uma origem.** Isso é intencional. Adicione a
origem com `/codex computer-use install --source <marketplace-source>` explícito
primeiro; então, futuras instalações automáticas no início da rodada poderão usar o
marketplace local descoberto.

## Relacionados

- [Harness do Codex](/pt-BR/plugins/codex-harness)
- [Ponte Peekaboo](/pt-BR/platforms/mac/peekaboo)
- [Aplicativo iOS](/pt-BR/platforms/ios)
