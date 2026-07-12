---
read_when:
    - Instalando o aplicativo para macOS
    - Como decidir entre o modo local e remoto do Gateway no macOS
    - Procurando downloads de versões do aplicativo para macOS
summary: Instale e use o aplicativo OpenClaw para a barra de menus do macOS
title: aplicativo para macOS
x-i18n:
    generated_at: "2026-07-12T15:25:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6f15d0840b7ceb8ac4d82f2c67c060c4b7e8bd25cbb12c216b93be31cb2604b0
    source_path: platforms/macos.md
    workflow: 16
---

O app para macOS é o **companheiro da barra de menus** do OpenClaw: interface nativa na bandeja, solicitações de permissão do macOS, notificações, WebChat, entrada de voz, Canvas e
ferramentas de Node hospedadas no Mac, como `system.run`.

Precisa apenas da CLI e do Gateway? Comece por [Primeiros passos](/pt-BR/start/getting-started).

## Download

Obtenha as compilações do app para macOS nas [versões do OpenClaw no GitHub](https://github.com/openclaw/openclaw/releases).
Quando uma versão incluir artefatos do app para macOS, procure por:

- `OpenClaw-<version>.dmg` (preferencial)
- `OpenClaw-<version>.zip`

Algumas versões incluem apenas a CLI, evidências ou artefatos para Windows. Se a versão mais recente
não tiver um artefato do app para macOS, use a versão mais recente que tenha ou compile a partir do código-fonte com a
[configuração de desenvolvimento para macOS](/pt-BR/platforms/mac/dev-setup).

## Primeira execução

1. Instale e inicie o **OpenClaw.app**.
2. Escolha **Este Mac** para um Gateway local ou conecte-se a um Gateway remoto.
3. Modo local: aguarde enquanto o app instala seu ambiente de execução no espaço do usuário e o Gateway.
4. Estabeleça a inferência com uma verificação de modelo ativo. Após a aprovação, o Crestodian
   cuida do restante da configuração.
5. Conclua a lista de verificação de permissões do macOS e envie a mensagem de teste de integração inicial.

Se o app acessar um Gateway existente cujo agente padrão tenha um
modelo configurado, ele considerará esse Gateway já configurado, ignorará a integração inicial do provedor e o
Crestodian e abrirá o painel. Se não for possível conectar-se ao Gateway ou se o
agente padrão não tiver um modelo, a integração inicial de inferência continuará disponível para
recuperação.

Para o fluxo de configuração da CLI/do Gateway, use [Primeiros passos](/pt-BR/start/getting-started).
Para recuperar permissões, use [Permissões do macOS](/pt-BR/platforms/mac/permissions).

## Atualizações

O cartão de atualização do painel atualiza primeiro o app assinado para macOS por meio do Sparkle.
Após a reinicialização do app, ele atualiza e reinicia automaticamente o
Gateway local correspondente gerenciado pelo app. As instalações da CLI gerenciadas pelo usuário via Homebrew ou outros meios mantêm
o fluxo normal de atualização do Gateway (o cartão executa diretamente a atualização do Gateway),
e o reparo automático nunca rebaixa um Gateway mais recente nem substitui uma
fixação de canal `extended-stable`.

O Sparkle segue a configuração `update.channel` do Gateway. `beta` e `dev` habilitam
as compilações beta do app; `stable`, `extended-stable` e valores ausentes ou desconhecidos
permanecem nas compilações estáveis do app.

## Abrir links do painel

No painel incorporado ao app para macOS, clicar em um link externo da Web abre-o em uma barra lateral redimensionável do navegador. Cada link é aberto em sua própria aba; clicar novamente no mesmo link reutiliza a aba existente. Arraste as abas para reordená-las, feche-as com o botão de fechar da aba ou com um clique do botão do meio e clique com o botão direito em uma aba para acessar **Abrir no navegador padrão**, **Copiar link**, **Recarregar**, **Fechar aba** e **Fechar outras abas**. Os controles de voltar/avançar na barra de título da janela e os gestos no trackpad navegam pelo histórico do painel; os controles próprios de voltar/avançar da barra lateral navegam pelo histórico da aba ativa. A barra lateral também tem controles para recarregar, abrir no navegador padrão e fechar, além de lembrar sua largura.

Os controles da barra de título acompanham a barra lateral do app: enquanto ela está expandida, os botões de voltar/avançar ficam na borda direita, ao lado do botão para alternar a barra lateral; enquanto ela está recolhida, eles dão lugar a um botão de pesquisa (que abre a paleta de comandos) e a um botão de nova sessão.

Clique com o botão direito em um link externo para escolher **Abrir na barra lateral**, **Abrir no navegador padrão** ou **Copiar link**. Cliques com teclas modificadoras e links para novas janelas ativados pelo usuário no painel continuam sendo abertos no navegador padrão; links para novas janelas dentro da barra lateral são abertos como novas abas da barra lateral. As páginas comuns da interface de controle hospedadas no navegador mantêm o comportamento normal de links e do menu de contexto do navegador.

## Importar logins do navegador

Quando o app é executado com um Gateway local e existe no Mac um perfil da família Chrome com cookies, a janela do painel exibe um banner dispensável que oferece copiar esses cookies para um perfil gerenciado isolado, usado pelos agentes para navegação. Escolha um perfil no controle **Importar** do banner (o Touch ID pode ser necessário); o progresso e a contagem de cookies importados aparecem no próprio banner, e somente os cookies são copiados — as senhas nunca saem do navegador de origem. Dispensar o banner registra a escolha; **Configurações → Geral → Login do navegador → Importar…** volta a oferecê-la a qualquer momento. Consulte [Navegador](/pt-BR/cli/browser) para conhecer o fluxo de importação subjacente e a restrição `browser.allowSystemProfileImport`.

## Escolher um modo de Gateway

| Modo   | Use quando                                                                     | Página de detalhes                                  |
| ------ | ------------------------------------------------------------------------------ | --------------------------------------------------- |
| Local  | Este Mac deve executar o Gateway e mantê-lo ativo com o launchd.               | [Gateway no macOS](/pt-BR/platforms/mac/bundled-gateway)  |
| Remoto | Outro host executa o Gateway; este Mac o controla por SSH, LAN ou Tailnet.     | [Controle remoto](/pt-BR/platforms/mac/remote)            |

O modo local requer uma CLI `openclaw` instalada. Em um Mac novo, o app instala
automaticamente a CLI e o ambiente de execução correspondentes antes de iniciar o assistente do Gateway.
Consulte [Gateway no macOS](/pt-BR/platforms/mac/bundled-gateway) para realizar a recuperação manual.

## O que o app gerencia

- Status da barra de menus, notificações, integridade e WebChat.
- Solicitações de permissão do macOS para tela, microfone, fala, automação e acessibilidade.
- Ferramentas de Node locais: Canvas, captura de câmera/tela, notificações e `system.run`.
- Solicitações de aprovação de execução para comandos hospedados no Mac.
- Túneis SSH no modo remoto ou conexões diretas com o Gateway.

O app **não** substitui a documentação geral da CLI nem do Gateway. A configuração do Gateway,
os provedores, plugins, canais, ferramentas e a segurança têm suas
próprias documentações.

## Páginas detalhadas sobre o macOS

| Tarefa                                           | Leia                                                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Instalar ou depurar o serviço da CLI/do Gateway  | [Gateway no macOS](/pt-BR/platforms/mac/bundled-gateway)                                                |
| Manter o estado fora de pastas sincronizadas com a nuvem | [Gateway no macOS](/pt-BR/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| Depurar a descoberta e a conectividade do app    | [Gateway no macOS](/pt-BR/platforms/mac/bundled-gateway#debug-app-connectivity)                         |
| Entender o comportamento do launchd              | [Ciclo de vida do Gateway](/pt-BR/platforms/mac/child-process)                                          |
| Corrigir problemas de permissões ou assinatura/TCC | [Permissões do macOS](/pt-BR/platforms/mac/permissions)                                               |
| Detectar o Mac usado mais recentemente           | [Presença do computador ativo](/nodes/presence)                                                   |
| Conectar-se a um Gateway remoto                  | [Controle remoto](/pt-BR/platforms/mac/remote)                                                          |
| Consultar o status da barra de menus e as verificações de integridade | [Barra de menus](/pt-BR/platforms/mac/menu-bar), [Verificações de integridade](/pt-BR/platforms/mac/health) |
| Usar a interface de chat incorporada             | [WebChat](/pt-BR/platforms/mac/webchat)                                                                 |
| Usar ativação por voz ou pressione para falar    | [Ativação por voz](/pt-BR/platforms/mac/voicewake)                                                      |
| Usar o Canvas e links diretos do Canvas          | [Canvas](/pt-BR/platforms/mac/canvas)                                                                   |
| Hospedar o PeekabooBridge para automação da interface | [Ponte do Peekaboo](/pt-BR/platforms/mac/peekaboo)                                                |
| Configurar aprovações de comandos                | [Aprovações de execução](/pt-BR/tools/exec-approvals), [detalhes avançados](/pt-BR/tools/exec-approvals-advanced) |
| Inspecionar comandos do Node Mac e o IPC do app  | [IPC do macOS](/pt-BR/platforms/mac/xpc)                                                                |
| Capturar logs                                    | [Logs do macOS](/pt-BR/platforms/mac/logging)                                                           |
| Compilar a partir do código-fonte                | [Configuração de desenvolvimento para macOS](/pt-BR/platforms/mac/dev-setup)                            |

## Relacionado

- [Plataformas](/pt-BR/platforms)
- [Primeiros passos](/pt-BR/start/getting-started)
- [Gateway](/pt-BR/gateway)
- [Aprovações de execução](/pt-BR/tools/exec-approvals)
