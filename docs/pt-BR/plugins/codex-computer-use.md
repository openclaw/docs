---
read_when:
    - Você quer que agentes do OpenClaw no modo Codex usem o Codex Computer Use
    - Você está escolhendo entre Codex Computer Use, PeekabooBridge e o MCP direto do cua-driver
    - Você está configurando computerUse para o Plugin Codex incluído
    - Você está solucionando problemas de status ou instalação do uso do computador do /codex
summary: Configure o Codex Computer Use para agentes OpenClaw no modo Codex
title: Uso do computador pelo Codex
x-i18n:
    generated_at: "2026-07-12T15:28:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a55ee330c4952c8bcc97c3178a85a67ea3b7964e6880277bd41d2bfc750e3138
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use é um plugin MCP nativo do Codex para controle do desktop local. O OpenClaw
não inclui o aplicativo de desktop, não executa ações no desktop por conta própria nem contorna
as permissões do Codex. O plugin `codex` incluído apenas prepara o app-server do Codex:
ele habilita o suporte a plugins do Codex, localiza ou instala o plugin Computer Use
configurado, verifica se o servidor MCP `computer-use` está disponível e então permite
que o Codex controle as chamadas nativas de ferramentas MCP durante os turnos no modo Codex.

Use esta página quando o OpenClaw já estiver usando o harness nativo do Codex. Para a
configuração do runtime em si, consulte [harness do Codex](/pt-BR/plugins/codex-harness).

Isso é diferente da [ferramenta de computador baseada em Node](/nodes/computer-use) integrada ao OpenClaw. Use a ferramenta integrada quando o mesmo contrato de agente precisar controlar um Mac pareado, independentemente de o agente ser executado no Gateway ou em outro Node. Use o Codex Computer Use quando o app-server do Codex precisar controlar a instalação local do MCP, as permissões e as chamadas nativas de ferramentas.

## OpenClaw.app e Peekaboo

A integração do Peekaboo com o OpenClaw.app é separada do Codex Computer Use. O
aplicativo para macOS pode hospedar um soquete PeekabooBridge para que a CLI `peekaboo` possa reutilizar as
permissões locais de Acessibilidade e Gravação de Tela do aplicativo para as próprias
ferramentas de automação do Peekaboo. Essa ponte não instala nem atua como proxy do Codex Computer Use, e
o Codex Computer Use não faz chamadas por meio do soquete PeekabooBridge.

Use a [ponte do Peekaboo](/pt-BR/platforms/mac/peekaboo) quando quiser que o OpenClaw.app seja
um host ciente de permissões para a automação da CLI do Peekaboo. Use esta página quando um
agente do OpenClaw no modo Codex precisar ter o plugin MCP nativo `computer-use` do Codex
disponível antes do início do turno.

## Aplicativo para iOS

O aplicativo para iOS é separado do Codex Computer Use. Ele não instala nem atua como proxy
do servidor MCP `computer-use` do Codex e não é um backend de controle de desktop.
Em vez disso, o aplicativo para iOS se conecta como um Node do OpenClaw e expõe recursos
móveis por meio de comandos do Node, como `canvas.*`, `camera.*`, `screen.*`,
`location.*` e `talk.*`.

Use [iOS](/pt-BR/platforms/ios) quando quiser que um agente controle um Node do iPhone
por meio do Gateway. Use esta página quando um agente no modo Codex precisar controlar o
desktop local do macOS por meio do plugin nativo Computer Use do Codex.

## MCP direto do cua-driver

O Codex Computer Use não é a única maneira de disponibilizar o controle de desktop. Se quiser
que runtimes gerenciados pelo OpenClaw chamem diretamente o driver da TryCua, use o servidor
`cua-driver mcp` upstream por meio do registro MCP do OpenClaw, em vez do
fluxo de marketplace específico do Codex.

Depois de instalar o `cua-driver`, peça a ele o comando do OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

ou registre o servidor stdio diretamente:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Esse caminho mantém intacta a superfície de ferramentas MCP upstream, incluindo os esquemas
do driver e as respostas MCP estruturadas. Use-o quando quiser disponibilizar o driver CUA
como um servidor MCP normal do OpenClaw. Use a configuração do Codex Computer Use nesta
página quando o app-server do Codex precisar controlar a instalação do plugin, os recarregamentos do MCP
e as chamadas nativas de ferramentas dentro dos turnos no modo Codex.

O driver da CUA é específico do macOS e ainda requer as permissões locais do macOS
solicitadas pelo aplicativo, como Acessibilidade e Gravação de Tela. O OpenClaw não
instala o `cua-driver`, não concede essas permissões nem contorna o modelo de segurança
do driver upstream.

## Configuração rápida

Defina `plugins.entries.codex.config.computerUse` quando os turnos no modo Codex precisarem ter
o Computer Use disponível antes do início de uma thread. `autoInstall: true` ativa
o Computer Use e permite que o OpenClaw o instale ou reative antes do turno:

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
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Com essa configuração, o OpenClaw verifica o app-server do Codex antes de cada turno no modo Codex.
Se o Computer Use estiver ausente, mas o app-server do Codex já tiver descoberto
um marketplace instalável, o OpenClaw solicita que o app-server do Codex instale ou
reative o plugin e recarregue os servidores MCP. No macOS, quando nenhum
marketplace correspondente estiver registrado e existir um pacote padrão do aplicativo de desktop, o OpenClaw
também tentará registrar o marketplace do Codex incluído em
`/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled`, mantendo
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`
como fallback para instalações autônomas legadas. Se a configuração ainda não conseguir disponibilizar o
servidor MCP, o turno falhará antes do início da thread.

Depois de alterar a configuração do Computer Use, use `/new` ou `/reset` no
chat afetado antes de testar, caso uma thread existente do Codex já tenha sido iniciada.

No macOS, a inicialização gerenciada do Computer Use dá preferência ao binário do aplicativo de desktop em
`/Applications/ChatGPT.app/Contents/Resources/codex` e depois usa como
fallback `/Applications/Codex.app/Contents/Resources/codex` para instalações
autônomas legadas. Isso também se aplica aos comandos avulsos de status e
instalação do Computer Use que iniciam seu próprio cliente. Isso mantém o controle do desktop sob
o pacote do aplicativo que possui as permissões locais do macOS. Se o aplicativo de desktop não estiver
instalado, o OpenClaw usa como fallback o binário gerenciado do Codex instalado junto ao
plugin. Turnos gerenciados comuns do Codex com o diretório inicial isolado padrão do agente dão preferência
primeiro a esse pacote fixado, para que um aplicativo de desktop mais antigo não possa sobrepor o suporte atual
a modelos. Diretórios iniciais com escopo de usuário continuam dando preferência ao desktop porque podem carregar o estado nativo
do Computer Use. Um diretório inicial isolado de agente cuja configuração efetiva do Codex habilite
o Computer Use também continua dando preferência ao desktop. Uma configuração explícita de
`appServer.command` ou `OPENCLAW_CODEX_APP_SERVER_BIN` ainda substitui
essa seleção gerenciada.

O OpenClaw serializa as leituras da configuração nativa do Codex e a instalação do Computer Use
dentro de um único Gateway em execução. Um processo separado do Codex ou outro Gateway não
faz parte dessa exclusão mútua. Depois de alterar a configuração nativa de plugins do Codex fora do
Gateway, reinicie o Gateway e inicie um novo chat antes de depender da nova
seleção.

## Comandos

Use os comandos `/codex computer-use` em qualquer superfície de chat na qual a
superfície de comandos do plugin `codex` esteja disponível. Estes são comandos de chat/runtime
do OpenClaw, não subcomandos da CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` é a ação padrão e é somente leitura: ele não adiciona fontes de marketplace,
não instala plugins nem habilita o suporte a plugins do Codex. Se nenhuma configuração
ativar o Computer Use, `status` poderá informar que ele está desabilitado mesmo após um comando
avulso de instalação.

`install` habilita o suporte a plugins do app-server do Codex, opcionalmente adiciona uma
fonte de marketplace configurada, instala ou reativa o plugin configurado
por meio do app-server do Codex, recarrega os servidores MCP e verifica se o servidor MCP
disponibiliza ferramentas. Como a instalação altera recursos confiáveis do host,
somente um proprietário ou um cliente `operator.admin` do Gateway pode executar `install`. Outros
remetentes autorizados podem continuar usando o comando `status` somente leitura,
inclusive com substituições.

Versões anteriores aceitavam substituições avulsas de identidade por meio de `--plugin`, `--server` e `--mcp-server`.
Em vez disso, configure `computerUse.pluginName` e
`computerUse.mcpServerName` de forma persistente. Quando um sinalizador legado de identidade
é usado, o comando identifica a configuração exata que deve ser persistida e repete a
ação solicitada, além de quaisquer sinalizadores de marketplace compatíveis, em suas orientações de migração.

## Opções de marketplace

O OpenClaw usa a mesma API do app-server disponibilizada pelo próprio Codex. Os
campos de marketplace determinam onde o Codex deve encontrar `computer-use`.

| Campo                | Use quando                                                        | Suporte à instalação                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Nenhum campo de marketplace | Você quer que o app-server do Codex use marketplaces que ele já conhece. | Sim, quando o app-server retorna um marketplace local.        |
| `marketplaceSource`  | Você tem uma fonte de marketplace do Codex que o app-server pode adicionar.         | Sim, para `/codex computer-use install` explícito.         |
| `marketplacePath`    | Você já conhece o caminho local do arquivo de marketplace no host.   | Sim, para instalação explícita e instalação automática no início do turno.   |
| `marketplaceName`    | Você quer selecionar pelo nome um marketplace já registrado.  | Sim, somente quando o marketplace selecionado tem um caminho local. |

Diretórios iniciais novos do Codex podem precisar de um breve momento para inicializar seus
marketplaces oficiais. Durante a instalação, o OpenClaw consulta `plugin/list` por até
`marketplaceDiscoveryTimeoutMs` milissegundos (padrão de 60 segundos).

Se vários marketplaces conhecidos contiverem o Computer Use, o OpenClaw dará preferência a
`openai-bundled`, depois a `openai-curated` e então a `local`. Correspondências
desconhecidas e ambíguas falham de forma segura e solicitam que você defina `marketplaceName` ou
`marketplacePath`.

## Marketplace incluído no macOS

As versões atuais do ChatGPT para desktop incluem o Computer Use neste local; versões legadas
autônomas do Codex para desktop usam o mesmo layout em `Codex.app`:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Quando `computerUse.autoInstall` é true e nenhum marketplace que contenha
`computer-use` está registrado, o OpenClaw tenta adicionar a primeira raiz de marketplace
incluída padrão que existir:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Você também pode registrá-la explicitamente em um shell com o Codex:

```bash
codex plugin marketplace add /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

Se você usa um caminho não padrão para o aplicativo Codex, execute `/codex computer-use install
--source <marketplace-root>` uma vez ou defina `computerUse.marketplacePath` como um
caminho local do arquivo de marketplace. Use `--marketplace-path` somente quando tiver o
caminho do arquivo JSON do marketplace, não a raiz do marketplace incluído.

### Cache compartilhado de plugins

O `pluginCacheMode: "independent"` padrão deixa cada diretório inicial do Codex e seu
cache de plugins sem gerenciamento. Defina `pluginCacheMode: "shared"` para copiar o plugin
Computer Use incluído para o cache de plugins detectável do diretório inicial ativo do Codex
antes da inicialização do app-server. O modo compartilhado preserva versões antigas em cache porque
clientes Codex em execução ainda podem consultar seus diretórios versionados de plugins; uma
falha na cópia de substituição também preserva o cache ativo. Uma configuração explícita de
`marketplaceName` ou `marketplacePath` desabilita essa
reconciliação para que o OpenClaw não substitua essa seleção.

## Limitação do catálogo remoto

O app-server do Codex pode listar e ler entradas exclusivamente remotas do catálogo, mas
atualmente não oferece suporte a `plugin/install` remoto. Isso significa que `marketplaceName`
pode selecionar um marketplace exclusivamente remoto para verificações de status, mas instalações e
reativações ainda precisam de um marketplace local por meio de `marketplaceSource` ou
`marketplacePath`.

Se o status informar que o plugin está disponível em um marketplace remoto do Codex, mas
a instalação remota não for compatível, execute a instalação com uma fonte ou caminho local:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Referência de configuração

| Campo                           | Padrão         | Significado                                                                                           |
| ------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------- |
| `enabled`                       | inferido       | Exige o Computer Use. O padrão é true quando outro campo do Computer Use está definido.               |
| `autoInstall`                   | false          | Instala ou reativa a partir de marketplaces já descobertos no início do turno.                        |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Por quanto tempo a instalação aguarda a descoberta de marketplaces pelo app-server do Codex.         |
| `liveTestTimeoutMs`             | 60000          | Tempo limite da thread temporária de prontidão e de suas solicitações de limpeza.                     |
| `toolCallTimeoutMs`             | 60000          | Tempo limite da chamada da ferramenta de prontidão `list_apps` do Computer Use.                       |
| `healthCheckEnabled`            | false          | Executa sondagens periódicas de prontidão enquanto o cliente app-server proprietário estiver ativo.  |
| `healthCheckIntervalMinutes`    | 60             | Frequência das sondagens; os valores aceitos são 30, 60, 120 ou 240 minutos.                          |
| `pluginCacheMode`               | `independent`  | Use `shared` para atualizar o cache do diretório inicial do Codex pelo plugin de desktop incluído.    |
| `strictReadiness`               | false          | Interrompe a inicialização quando uma sondagem ao vivo falha, em vez de continuar com um aviso.       |
| `autoRepair`                    | false          | Encerra processos filhos MCP obsoletos e restritos ao escopo do Computer Use e repete uma vez uma sondagem com falha. |
| `marketplaceSource`             | não definido   | String de origem passada para `marketplace/add` do app-server do Codex.                               |
| `marketplacePath`               | não definido   | Caminho do arquivo local do marketplace do Codex que contém o plugin.                                 |
| `marketplaceName`               | não definido   | Nome registrado do marketplace do Codex a ser selecionado.                                           |
| `pluginName`                    | `computer-use` | Nome do plugin no marketplace do Codex.                                                               |
| `mcpServerName`                 | `computer-use` | Nome do servidor MCP exposto pelo plugin instalado.                                                   |

A instalação automática no início do turno recusa intencionalmente valores
configurados de `marketplaceSource`. Adicionar uma nova origem é uma operação
explícita de configuração; portanto, use
`/codex computer-use install --source <marketplace-source>` uma vez e depois
deixe que `autoInstall` cuide das futuras reativações a partir dos marketplaces
locais descobertos. A instalação automática no início do turno pode usar um
`marketplacePath` configurado, pois ele já é um caminho local no host.

Cada campo também aceita uma substituição por variável de ambiente, verificada
quando a chave de configuração correspondente não está definida:

| Campo                           | Variável de ambiente                                            |
| ------------------------------- | -------------------------------------------------------------- |
| `enabled`                       | `OPENCLAW_CODEX_COMPUTER_USE`                                  |
| `autoInstall`                   | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_INSTALL`                     |
| `marketplaceDiscoveryTimeoutMs` | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_DISCOVERY_TIMEOUT_MS` |
| `liveTestTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_LIVE_TEST_TIMEOUT_MS`             |
| `toolCallTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_TOOL_CALL_TIMEOUT_MS`             |
| `healthCheckEnabled`            | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_ENABLED`             |
| `healthCheckIntervalMinutes`    | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_INTERVAL_MINUTES`    |
| `pluginCacheMode`               | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_CACHE_MODE`                |
| `strictReadiness`               | `OPENCLAW_CODEX_COMPUTER_USE_STRICT_READINESS`                 |
| `autoRepair`                    | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_REPAIR`                      |
| `marketplaceSource`             | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_SOURCE`               |
| `marketplacePath`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_PATH`                 |
| `marketplaceName`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_NAME`                 |
| `pluginName`                    | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_NAME`                      |
| `mcpServerName`                 | `OPENCLAW_CODEX_COMPUTER_USE_MCP_SERVER_NAME`                  |

## O que o OpenClaw verifica

O OpenClaw relata internamente um motivo de configuração estável e formata o
status voltado ao usuário para o chat:

| Motivo                       | Significado                                                          | Próxima etapa                                         |
| ---------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------- |
| `disabled`                   | `computerUse.enabled` foi resolvido como false.                      | Defina `enabled` ou outro campo do Computer Use.      |
| `marketplace_missing`        | Nenhum marketplace correspondente estava disponível.                | Configure a origem, o caminho ou o nome do marketplace. |
| `plugin_not_installed`       | O marketplace existe, mas o plugin não está instalado.               | Execute a instalação ou habilite `autoInstall`.       |
| `plugin_disabled`            | O plugin está instalado, mas desabilitado na configuração do Codex.  | Execute a instalação para reativá-lo.                 |
| `remote_install_unsupported` | O marketplace selecionado está disponível somente remotamente.      | Use `marketplaceSource` ou `marketplacePath`.         |
| `mcp_missing`                | O plugin está habilitado, mas o servidor MCP não está disponível.    | Verifique o Computer Use do Codex e as permissões do SO. |
| `ready`                      | O plugin e as ferramentas MCP estão disponíveis.                     | Inicie o turno no modo Codex.                         |
| `check_failed`               | Uma solicitação ao app-server do Codex falhou durante a verificação de status. | Verifique a conectividade e os logs do app-server. |
| `auto_install_blocked`       | A configuração no início do turno precisaria adicionar uma nova origem. | Execute primeiro a instalação explícita.           |

A saída do chat inclui o estado do plugin, o estado do servidor MCP, o
marketplace, as ferramentas quando disponíveis e a mensagem específica da
etapa de configuração que falhou.

## Permissões do macOS

O Computer Use é específico do macOS. O servidor MCP pertencente ao Codex pode
precisar de permissões locais do SO antes de poder inspecionar ou controlar
aplicativos. Se o OpenClaw informar que o Computer Use está instalado, mas o
servidor MCP não está disponível, verifique primeiro a configuração do Computer
Use no lado do Codex:

- O app-server do Codex está em execução no mesmo host em que o controle da área
  de trabalho deve ocorrer.
- O plugin Computer Use está habilitado na configuração do Codex.
- O servidor MCP `computer-use` aparece no status MCP do app-server do Codex.
- O macOS concedeu as permissões necessárias ao aplicativo de controle da área
  de trabalho.
- A sessão atual do host pode acessar a área de trabalho que está sendo
  controlada.

O OpenClaw falha intencionalmente de forma segura quando `computerUse.enabled` é true. Um
turno no modo Codex não deve prosseguir silenciosamente sem as ferramentas nativas de desktop
exigidas pela configuração.

## Solução de problemas

**O status informa que não está instalado.** Execute `/codex computer-use install`. Se o
marketplace não for detectado, forneça `--source` ou `--marketplace-path`.

**O status informa que está instalado, mas desabilitado.** Execute `/codex computer-use install`
novamente. A instalação pelo app-server do Codex atualiza a configuração do plugin para habilitado.

**O status informa que a instalação remota não é compatível.** Use uma origem ou um caminho de
marketplace local. Entradas de catálogo exclusivamente remotas podem ser inspecionadas, mas não
instaladas por meio da API atual do app-server.

**O status informa que o servidor MCP está indisponível.** Execute a instalação novamente uma vez para que os
servidores MCP sejam recarregados. Se ele continuar indisponível, corrija o aplicativo Codex Computer Use,
o status do MCP no app-server do Codex ou as permissões do macOS.

**O status ou uma sondagem excede o tempo limite em `computer-use.list_apps`.** O plugin e o
servidor MCP estão presentes, mas a ponte local do Computer Use não respondeu.
Feche ou reinicie o Codex Computer Use, reinicie o Codex Desktop se necessário e
tente novamente em uma nova sessão do OpenClaw. Se o host tiver executado anteriormente o Computer Use
por meio de um app-server gerenciado mais antigo do Codex, atualize o plugin instalado usando
o marketplace incluído no aplicativo de desktop (use o caminho de `Codex.app` para instalações
independentes do Codex Desktop):

```text
/codex computer-use install --source /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

**Uma ferramenta do Computer Use informa `Native hook relay unavailable`.** O
gancho de ferramenta nativo do Codex não conseguiu alcançar um relay ativo do OpenClaw por meio da
ponte local ou do fallback do Gateway. Inicie uma nova sessão do OpenClaw com `/new`
ou `/reset`. Se funcionar uma vez e falhar novamente em uma chamada de ferramenta posterior,
`/new` está apenas limpando a tentativa atual; reinicie o app-server do Codex ou o
Gateway do OpenClaw para que threads antigas e registros de ganchos sejam descartados e
tente novamente em uma nova sessão.

**A instalação automática no início do turno recusa uma origem.** Isso é intencional. Primeiro, adicione a
origem explicitamente com `/codex computer-use install --source
<marketplace-source>`; assim, as futuras instalações automáticas no início do turno poderão usar o
marketplace local detectado.

## Relacionados

- [Harness do Codex](/pt-BR/plugins/codex-harness)
- [Ponte Peekaboo](/pt-BR/platforms/mac/peekaboo)
- [Aplicativo para iOS](/pt-BR/platforms/ios)
