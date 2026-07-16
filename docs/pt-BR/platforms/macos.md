---
read_when:
    - Instalação do aplicativo para macOS
    - Como decidir entre o modo Gateway local e remoto no macOS
    - Procurando downloads de versões do aplicativo para macOS
summary: Instale e use o aplicativo OpenClaw para a barra de menus do macOS
title: aplicativo para macOS
x-i18n:
    generated_at: "2026-07-16T12:40:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c6aaf107eb564dd8a444069fee31bb190efe41da9f26b3c52f42fdbbcaf8690c
    source_path: platforms/macos.md
    workflow: 16
---

O aplicativo para macOS é o **companheiro da barra de menus** do OpenClaw: interface nativa na bandeja, solicitações de permissão do macOS, notificações, WebChat, entrada de voz, Canvas e ferramentas de Node hospedadas no Mac, como `system.run`.

Precisa apenas da CLI e do Gateway? Comece com [Primeiros passos](/pt-BR/start/getting-started).

## Download

Obtenha as versões do aplicativo para macOS nas [versões do OpenClaw no GitHub](https://github.com/openclaw/openclaw/releases).
Quando uma versão incluir artefatos do aplicativo para macOS, procure por:

- `OpenClaw-<version>.dmg` (preferencial)
- `OpenClaw-<version>.zip`

Algumas versões incluem apenas a CLI, evidências ou artefatos do Windows. Se a versão mais recente
não tiver um artefato do aplicativo para macOS, use a versão mais recente que tenha ou compile a partir do código-fonte com a
[configuração de desenvolvimento para macOS](/pt-BR/platforms/mac/dev-setup).

## Primeira execução

1. Instale e inicie o **OpenClaw.app**.
2. Escolha **This Mac** para um Gateway local ou conecte-se a um Gateway remoto.
3. Aguarde enquanto o aplicativo instala o runtime correspondente da CLI. No modo local, ele também
   instala e inicia o Gateway.
4. Estabeleça a inferência com uma verificação de modelo em funcionamento. Após a aprovação, o OpenClaw
   cuida do restante da configuração.
5. Conclua a lista de verificação de permissões do macOS e envie a mensagem de teste de integração.

Se o aplicativo acessar um Gateway existente cujo agente padrão tenha um
modelo configurado, ele considerará esse Gateway já configurado, ignorará a integração do provedor e do
OpenClaw e abrirá o painel. Se não for possível conectar ao Gateway ou se o
agente padrão não tiver um modelo, a integração de inferência continuará disponível para
recuperação.

Para o processo de configuração da CLI/do Gateway, use [Primeiros passos](/pt-BR/start/getting-started).
Para recuperar permissões, use [Permissões do macOS](/pt-BR/platforms/mac/permissions).

## Atualizações

O cartão de atualização do painel informa o que o aplicativo atualizará:

- **Update Mac app + Gateway** significa que o aplicativo assinado é responsável pelo Gateway
  local do launchd. O Sparkle atualiza primeiro o aplicativo; após a reinicialização, o aplicativo atualiza
  e reinicia automaticamente seu Gateway na versão correspondente e, em seguida, verifica a
  conexão.
- **Update Gateway** significa que o aplicativo está conectado a um Gateway remoto, a um Gateway local
  gerenciado manualmente ou a outra instalação pela qual o aplicativo não é responsável. O botão
  executa o processo normal de atualização desse Gateway em vez de alterar o aplicativo para Mac.

Uma atualização coordenada com falha permanece na janela no estilo de configuração, com opções de tentar novamente,
[guia de atualização](/pt-BR/install/updating) e ações do Discord. O reparo automático nunca
faz downgrade de um Gateway mais recente nem substitui uma fixação de canal `extended-stable`.

Após uma atualização bem-sucedida, o aplicativo encontra a sessão direta de nível superior
usada mais recentemente por uma pessoa e envia a esse agente um evento de atualização único. As atividades de Heartbeat
e Cron não afetam essa escolha. O agente pode então receber o usuário de volta
na conversa que ele provavelmente estava usando. No modo remoto, o aplicativo
atualiza apenas o runtime local do Node no Mac e ignora a notificação quando o
Gateway remoto é mais antigo que o aplicativo.

O Sparkle segue a configuração `update.channel` do Gateway. `beta` e `dev` habilitam
as versões beta do aplicativo; `stable`, `extended-stable` e valores ausentes ou desconhecidos
permanecem nas versões estáveis do aplicativo.

## Abrir links do painel

No painel integrado do aplicativo para macOS, clicar em um link externo da Web o abre em uma barra lateral redimensionável do navegador, ocupando metade da largura da janela e mantendo a navegação do painel visível. Arraste o divisor para escolher outra largura; o aplicativo memoriza essa escolha. Cada link é aberto em sua própria aba, a barra de abas aparece quando várias páginas estão abertas e clicar novamente no mesmo link reutiliza a aba existente. Arraste as abas para reordená-las, feche-as com o botão de fechar da aba ou com um clique do botão do meio e clique com o botão direito em uma aba para acessar **Open in Default Browser**, **Copy Link**, **Reload**, **Close Tab** e **Close Other Tabs**. Os controles de voltar/avançar da barra de título da janela e os gestos no trackpad navegam pelo histórico do painel; os controles próprios de voltar/avançar da barra lateral navegam pelo histórico da aba ativa. A barra lateral também tem controles para recarregar, abrir no navegador padrão e fechar.

Os controles da barra de título acompanham a barra lateral do aplicativo: enquanto ela está expandida, os controles de voltar/avançar ficam na borda direita, ao lado do botão de alternância da barra lateral; enquanto ela está recolhida, eles dão lugar a um botão de pesquisa (que abre a paleta de comandos) e a um botão de nova sessão.

Clique com o botão direito em um link externo para escolher **Open in Sidebar**, **Open in Default Browser** ou **Copy Link**. Cliques com teclas modificadoras e links para novas janelas ativados pelo usuário no painel continuam sendo abertos no navegador padrão; links para novas janelas dentro da barra lateral são abertos como novas abas da barra lateral. As páginas comuns da interface de controle hospedadas no navegador mantêm o comportamento normal de links e do menu de contexto do navegador.

## Importar logins do navegador

Na primeira vez que a barra lateral do navegador é aberta enquanto o aplicativo está conectado a um Gateway local, o painel mostra um banner dispensável quando existe no Mac um perfil da família Chrome com cookies. O banner oferece a opção de copiar esses cookies para um perfil gerenciado isolado que os agentes usam para navegação. Escolha um perfil no controle **Import** (o Touch ID pode ser necessário); o progresso e a quantidade de cookies importados aparecem na própria tela, e somente os cookies são copiados — as senhas nunca saem do navegador de origem. Dispensar o banner registra a escolha; **Settings → General → Browser login → Import…** volta a oferecê-la a qualquer momento. Consulte [Navegador](/pt-BR/cli/browser) para conhecer o processo de importação subjacente e a restrição `browser.allowSystemProfileImport`.

## Escolher um modo do Gateway

| Modo   | Use quando                                                                    | Página de detalhes                                        |
| ------ | ------------------------------------------------------------------------------ | -------------------------------------------------- |
| Local  | Este Mac deve executar o Gateway e mantê-lo ativo com o launchd.                | [Gateway no macOS](/pt-BR/platforms/mac/bundled-gateway) |
| Remoto | Outro host executa o Gateway; este Mac o controla por SSH, LAN ou Tailnet. | [Controle remoto](/pt-BR/platforms/mac/remote)            |

Ambos os modos precisam de uma CLI `openclaw` instalada porque o aplicativo reutiliza seu runtime
de host do Node. Em um Mac novo, o aplicativo instala automaticamente a CLI correspondente; o modo
local inicia então o assistente do Gateway, enquanto o modo remoto se conecta ao Gateway
selecionado sem iniciar um segundo Gateway local.
Consulte [Gateway no macOS](/pt-BR/platforms/mac/bundled-gateway) para recuperação manual.

## Responsabilidades do aplicativo

- Status da barra de menus, notificações, integridade e WebChat.
- Solicitações de permissão do macOS para tela, microfone, fala, automação e acessibilidade.
- Um Node do Mac que combina Canvas nativo, captura de câmera/tela, notificações,
  localização e controle do computador com os comandos de sistema, navegador,
  Plugin, Skills e MCP do host de Node da CLI.
- Solicitações de aprovação de execução para comandos hospedados no Mac.
- Execução no contexto do aplicativo para comandos de shell aprovados, preservando a atribuição
  de permissões do macOS ao aplicativo enquanto o runtime da CLI gerencia a política compartilhada do Node.
- Túneis SSH no modo remoto ou conexões diretas com o Gateway.

O aplicativo **não** substitui a documentação geral da CLI ou do Gateway. A configuração
do Gateway, os provedores, plugins, canais, ferramentas e a segurança são abordados em suas
próprias documentações.

## Páginas de detalhes do macOS

| Tarefa                                     | Leia                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| Instalar ou depurar o serviço da CLI/do Gateway | [Gateway no macOS](/pt-BR/platforms/mac/bundled-gateway)                                          |
| Manter o estado fora de pastas sincronizadas com a nuvem   | [Gateway no macOS](/pt-BR/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| Depurar a descoberta e a conectividade do aplicativo     | [Gateway no macOS](/pt-BR/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| Entender o comportamento do launchd              | [Ciclo de vida do Gateway](/pt-BR/platforms/mac/child-process)                                           |
| Corrigir problemas de permissões, assinatura ou TCC    | [Permissões do macOS](/pt-BR/platforms/mac/permissions)                                             |
| Detectar o Mac usado mais recentemente    | [Presença do computador ativo](/pt-BR/nodes/presence)                                                 |
| Conectar-se a um Gateway remoto              | [Controle remoto](/pt-BR/platforms/mac/remote)                                                     |
| Consultar o status da barra de menus e as verificações de integridade   | [Barra de menus](/pt-BR/platforms/mac/menu-bar), [Verificações de integridade](/pt-BR/platforms/mac/health)                 |
| Usar a interface de chat integrada                 | [WebChat](/pt-BR/platforms/mac/webchat)                                                           |
| Usar ativação por voz ou pressionar para falar           | [Ativação por voz](/pt-BR/platforms/mac/voicewake)                                                      |
| Usar Canvas e links diretos do Canvas         | [Canvas](/pt-BR/platforms/mac/canvas)                                                             |
| Hospedar o PeekabooBridge para automação da interface    | [Ponte do Peekaboo](/pt-BR/platforms/mac/peekaboo)                                                  |
| Configurar aprovações de comandos              | [Aprovações de execução](/pt-BR/tools/exec-approvals), [detalhes avançados](/pt-BR/tools/exec-approvals-advanced) |
| Inspecionar comandos do Node do Mac e o IPC do aplicativo    | [IPC do macOS](/pt-BR/platforms/mac/xpc)                                                             |
| Capturar logs                             | [Registro em log do macOS](/pt-BR/platforms/mac/logging)                                                     |
| Compilar a partir do código-fonte                        | [Configuração de desenvolvimento para macOS](/pt-BR/platforms/mac/dev-setup)                                                 |

## Relacionados

- [Plataformas](/pt-BR/platforms)
- [Primeiros passos](/pt-BR/start/getting-started)
- [Gateway](/pt-BR/gateway)
- [Aprovações de execução](/pt-BR/tools/exec-approvals)
