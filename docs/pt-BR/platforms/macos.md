---
read_when:
    - Instalando o aplicativo para macOS
    - Como decidir entre o modo Gateway local e remoto no macOS
    - Procurando downloads de versões do aplicativo para macOS
summary: Instale e use o aplicativo OpenClaw para a barra de menus do macOS
title: aplicativo para macOS
x-i18n:
    generated_at: "2026-07-12T21:30:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ef3ea75aa2f158829da643ca016681e40102cc4fad84e207e80b377d023c2e1f
    source_path: platforms/macos.md
    workflow: 16
---

O app para macOS é o **companheiro da barra de menus** do OpenClaw: interface nativa na bandeja, solicitações de permissão do macOS, notificações, WebChat, entrada de voz, Canvas e
ferramentas de Node hospedadas no Mac, como `system.run`.

Precisa apenas da CLI e do Gateway? Comece por [Primeiros passos](/pt-BR/start/getting-started).

## Download

Obtenha as versões do app para macOS nos [lançamentos do OpenClaw no GitHub](https://github.com/openclaw/openclaw/releases).
Quando um lançamento incluir artefatos do app para macOS, procure por:

- `OpenClaw-<version>.dmg` (preferencial)
- `OpenClaw-<version>.zip`

Alguns lançamentos incluem apenas a CLI, evidências ou artefatos para Windows. Se o lançamento mais recente
não tiver um artefato do app para macOS, use o mais recente que tiver ou compile a partir do código-fonte com a
[configuração de desenvolvimento para macOS](/pt-BR/platforms/mac/dev-setup).

## Primeira execução

1. Instale e inicie o **OpenClaw.app**.
2. Escolha **Este Mac** para um Gateway local ou conecte-se a um Gateway remoto.
3. Aguarde enquanto o app instala o runtime correspondente da CLI. No modo local, ele também
   instala e inicia o Gateway.
4. Estabeleça a inferência com uma verificação de modelo em tempo real. Depois que ela for aprovada, o Crestodian
   cuida do restante da configuração.
5. Conclua a lista de verificação de permissões do macOS e envie a mensagem de teste de integração.

Se o app acessar um Gateway existente cujo agente padrão tenha um
modelo configurado, ele considerará esse Gateway já configurado, ignorará a integração do provedor e o
Crestodian e abrirá o painel. Se não for possível conectar ao Gateway ou se o
agente padrão não tiver um modelo, a integração de inferência continuará disponível para
recuperação.

Para o fluxo de configuração da CLI/do Gateway, use [Primeiros passos](/pt-BR/start/getting-started).
Para recuperar permissões, use [Permissões do macOS](/pt-BR/platforms/mac/permissions).

## Atualizações

O cartão de atualização do painel atualiza primeiro o app assinado para macOS por meio do Sparkle.
Depois que o app é reiniciado, ele atualiza e reinicia automaticamente o
Gateway local correspondente gerenciado pelo app. Instalações da CLI gerenciadas pelo usuário via Homebrew e outros meios mantêm
o fluxo normal de atualização do Gateway (o cartão executa diretamente a atualização do Gateway),
e o reparo automático nunca rebaixa um Gateway mais recente nem substitui uma
fixação no canal `extended-stable`.

O Sparkle segue a configuração `update.channel` do Gateway. `beta` e `dev` habilitam
versões beta do app; `stable`, `extended-stable` e valores ausentes ou desconhecidos
permanecem nas versões estáveis do app.

## Abrir links do painel

No painel incorporado ao app para macOS, clicar em um link externo da web o abre em uma barra lateral redimensionável do navegador. Cada link é aberto em sua própria aba; clicar novamente no mesmo link reutiliza a aba existente. Arraste as abas para reordená-las, feche-as com o botão de fechar da aba ou com um clique do botão do meio e clique com o botão direito em uma aba para acessar **Abrir no navegador padrão**, **Copiar link**, **Recarregar**, **Fechar aba** e **Fechar outras abas**. Os controles de voltar/avançar na barra de título da janela e os gestos no trackpad navegam pelo histórico do painel; os controles próprios de voltar/avançar da barra lateral navegam pelo histórico da aba ativa. A barra lateral também tem controles para recarregar, abrir no navegador padrão e fechar, além de lembrar sua largura.

Os controles da barra de título acompanham a barra lateral do app: enquanto ela está expandida, os controles de voltar/avançar ficam na borda direita, ao lado do botão de alternância da barra lateral; enquanto ela está recolhida, eles dão lugar a um botão de pesquisa (que abre a paleta de comandos) e a um botão de nova sessão.

Clique com o botão direito em um link externo para escolher **Abrir na barra lateral**, **Abrir no navegador padrão** ou **Copiar link**. Cliques modificados e links de nova janela ativados pelo usuário no painel continuam sendo abertos no navegador padrão; links de nova janela dentro da barra lateral são abertos como novas abas da barra lateral. As páginas normais da interface de controle hospedadas no navegador mantêm o comportamento padrão de links e do menu de contexto do navegador.

## Importar logins do navegador

Quando o app é executado com um Gateway local e existe no Mac um perfil da família Chrome com cookies, a janela do painel exibe um banner dispensável oferecendo copiar esses cookies para um perfil gerenciado e isolado que os agentes usam para navegação. Escolha um perfil no controle **Importar** do banner (o Touch ID pode ser necessário); o progresso e a quantidade de cookies importados aparecem na própria interface, e somente os cookies são copiados — as senhas nunca saem do navegador de origem. Dispensar o banner registra a escolha; **Configurações → Geral → Login do navegador → Importar…** volta a oferecer essa opção a qualquer momento. Consulte [Navegador](/pt-BR/cli/browser) para conhecer o fluxo de importação subjacente e a restrição `browser.allowSystemProfileImport`.

## Escolher um modo de Gateway

| Modo   | Use quando                                                                     | Página de detalhes                                  |
| ------ | ------------------------------------------------------------------------------ | --------------------------------------------------- |
| Local  | Este Mac deve executar o Gateway e mantê-lo ativo com o launchd.               | [Gateway no macOS](/pt-BR/platforms/mac/bundled-gateway)  |
| Remoto | Outro host executa o Gateway; este Mac o controla por SSH, LAN ou Tailnet.     | [Controle remoto](/pt-BR/platforms/mac/remote)             |

Ambos os modos exigem uma CLI `openclaw` instalada, pois o app reutiliza o runtime
do host de Node dela. Em um Mac novo, o app instala automaticamente a CLI correspondente; o modo
local inicia então o assistente do Gateway, enquanto o modo remoto se conecta ao Gateway
selecionado sem iniciar um segundo Gateway local.
Consulte [Gateway no macOS](/pt-BR/platforms/mac/bundled-gateway) para recuperação manual.

## O que o app gerencia

- Status da barra de menus, notificações, integridade e WebChat.
- Solicitações de permissão do macOS para tela, microfone, fala, automação e acessibilidade.
- Um Node do Mac que combina Canvas nativo, captura de câmera/tela, notificações,
  localização e controle do computador com os comandos de sistema, navegador,
  Plugin, Skills e MCP do host de Node da CLI.
- Solicitações de aprovação de execução para comandos hospedados no Mac.
- Execução no contexto do app para comandos de shell aprovados, preservando a atribuição
  de permissões do macOS ao app enquanto o runtime da CLI gerencia a política compartilhada do Node.
- Túneis SSH no modo remoto ou conexões diretas com o Gateway.

O app **não** substitui a documentação do Gateway nem a documentação geral da CLI. Configuração do Gateway,
provedores, plugins, canais, ferramentas e segurança estão em suas
próprias documentações.

## Páginas de detalhes do macOS

| Tarefa                                            | Leia                                                                                         |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Instalar ou depurar o serviço da CLI/do Gateway   | [Gateway no macOS](/pt-BR/platforms/mac/bundled-gateway)                                           |
| Manter o estado fora de pastas sincronizadas com a nuvem | [Gateway no macOS](/pt-BR/platforms/mac/bundled-gateway#state-directory-on-macos)            |
| Depurar a descoberta e a conectividade do app     | [Gateway no macOS](/pt-BR/platforms/mac/bundled-gateway#debug-app-connectivity)                    |
| Entender o comportamento do launchd               | [Ciclo de vida do Gateway](/pt-BR/platforms/mac/child-process)                                     |
| Corrigir problemas de permissões ou assinatura/TCC | [Permissões do macOS](/pt-BR/platforms/mac/permissions)                                           |
| Detectar o Mac usado mais recentemente            | [Presença do computador ativo](/pt-BR/nodes/presence)                                              |
| Conectar-se a um Gateway remoto                   | [Controle remoto](/pt-BR/platforms/mac/remote)                                                      |
| Consultar o status da barra de menus e as verificações de integridade | [Barra de menus](/pt-BR/platforms/mac/menu-bar), [Verificações de integridade](/pt-BR/platforms/mac/health) |
| Usar a interface de chat incorporada              | [WebChat](/pt-BR/platforms/mac/webchat)                                                             |
| Usar ativação por voz ou pressione para falar     | [Ativação por voz](/pt-BR/platforms/mac/voicewake)                                                  |
| Usar o Canvas e links diretos do Canvas           | [Canvas](/pt-BR/platforms/mac/canvas)                                                               |
| Hospedar o PeekabooBridge para automação da interface | [Ponte do Peekaboo](/pt-BR/platforms/mac/peekaboo)                                             |
| Configurar aprovações de comandos                 | [Aprovações de execução](/pt-BR/tools/exec-approvals), [detalhes avançados](/pt-BR/tools/exec-approvals-advanced) |
| Inspecionar comandos do Node do Mac e o IPC do app | [IPC do macOS](/pt-BR/platforms/mac/xpc)                                                          |
| Capturar logs                                     | [Logs do macOS](/pt-BR/platforms/mac/logging)                                                       |
| Compilar a partir do código-fonte                 | [Configuração de desenvolvimento para macOS](/pt-BR/platforms/mac/dev-setup)                        |

## Relacionados

- [Plataformas](/pt-BR/platforms)
- [Primeiros passos](/pt-BR/start/getting-started)
- [Gateway](/pt-BR/gateway)
- [Aprovações de execução](/pt-BR/tools/exec-approvals)
