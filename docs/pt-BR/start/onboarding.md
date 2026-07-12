---
read_when:
    - Projetando o assistente de integração do macOS
    - Implementação da configuração de autenticação ou identidade
sidebarTitle: 'Onboarding: macOS App'
summary: Fluxo de configuração da primeira execução do OpenClaw (aplicativo para macOS)
title: Integração inicial (aplicativo para macOS)
x-i18n:
    generated_at: "2026-07-12T00:24:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cced671a375bd80cbdf920383add8cf01f75a85259963a4286e9ce49913d8b47
    source_path: start/onboarding.md
    workflow: 16
---

O fluxo de primeira execução do aplicativo para macOS: escolha onde o Gateway será executado, conecte um backend de IA verificado, conceda permissões e passe o controle para o ritual de inicialização do próprio agente.
Para a integração pela CLI e uma comparação entre os dois caminhos, consulte a [Visão geral da integração](/pt-BR/start/onboarding-overview).

<Steps>
<Step title="Aprovar o aviso do macOS">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Aprovar a localização de redes locais">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="Boas-vindas e aviso de segurança">
<Frame caption="Leia o aviso de segurança exibido e decida de acordo">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Modelo de confiança de segurança:

- Por padrão, o OpenClaw é um agente pessoal: um único limite de confiança com um operador confiável.
- Configurações compartilhadas ou com vários usuários precisam de restrições: separe os limites de confiança, mantenha o acesso às ferramentas no mínimo e siga as orientações de [Segurança](/pt-BR/gateway/security).
- Por padrão, a integração local define `tools.profile: "coding"` nas novas configurações, para que as instalações novas mantenham as ferramentas de sistema de arquivos e de ambiente de execução sem o perfil irrestrito `full`.
- Se hooks/webhooks ou outras fontes de conteúdo não confiável estiverem habilitados, use uma categoria de modelo moderna e robusta e mantenha políticas de ferramentas e isolamento em sandbox rigorosos.

</Step>
<Step title="Local ou remoto">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Onde o **Gateway** é executado?

- **Este Mac (somente local):** a integração configura a autenticação e grava as credenciais localmente.
- **Remoto (via SSH/Tailnet):** a integração **não** configura a autenticação local;
  as credenciais já devem existir no host do Gateway. O campo do token do Gateway
  remoto armazena o token usado pelo aplicativo para macOS para se conectar a esse
  Gateway; os valores SecretRef existentes de `gateway.remote.token` são preservados
  até que você os substitua.
- **Configurar depois:** ignore a configuração e deixe o aplicativo sem configurar.

<Tip>
**Dica de autenticação do Gateway:**

- O modo de autenticação do Gateway usa `token` por padrão, mesmo para associações de local loopback; portanto, os clientes WS locais precisam se autenticar.
- Definir `gateway.auth.mode: "none"` permite que qualquer processo local se conecte; use essa opção somente em máquinas totalmente confiáveis.
- Use um token para acesso entre várias máquinas ou associações que não sejam de local loopback.

</Tip>
</Step>
<Step title="CLI">
  A configuração local instala globalmente a CLI `openclaw` por meio do npm, pnpm ou bun,
  dando preferência ao npm. O Node continua sendo o ambiente de execução recomendado
  para o próprio Gateway. Instalações compatíveis existentes são reutilizadas.
</Step>
<Step title="Conecte sua IA">
  Um Gateway conectado que já tenha um modelo de agente configurado ignora esta
  página por completo e abre a interface normal do agente. A configuração do
  Crestodian e do provedor só é executada para um Gateway novo ou incompleto.

Quando o Gateway está pronto, a integração procura um acesso à IA que você já tenha:
um login do Claude Code ou Codex, ou `OPENAI_API_KEY` /
`ANTHROPIC_API_KEY`. A melhor opção é testada com uma conclusão real e
salva somente depois de responder; quando um teste falha, o aplicativo tenta
automaticamente a opção seguinte e mostra por que a anterior falhou. Se várias
opções forem encontradas, você poderá alternar entre elas antes de continuar.

A Gemini CLI continua disponível para agentes normais após a configuração, mas não é
oferecida aqui porque não consegue impor a sondagem de inferência sem ferramentas.

Você também pode iniciar sessão pelo próprio fluxo de OAuth ou de pareamento de dispositivo
do provedor. As opções integradas incluem OpenAI/ChatGPT, OpenRouter, GitHub Copilot, Google
Gemini CLI, xAI, MiniMax Global e CN e Chutes. A lista vem dos plugins ativos de
provedores de inferência de texto do Gateway, em vez de uma lista fixa do aplicativo,
portanto outro provedor pode optar pela inclusão sem adicionar código específico do
provedor para macOS.

O seletor manual de chave/token usa o mesmo registro de provedores. Em todos os caminhos,
o provedor fornece o modelo inicial e a configuração; o OpenClaw verifica
a credencial com o mesmo teste ao vivo antes de armazenar o perfil de autenticação. A opção
Próximo permanece bloqueada até que um backend seja aprovado; assim, a primeira conversa
com o agente não pode começar sem uma inferência funcional. Depois que essa verificação ao
vivo é aprovada, o Crestodian fica disponível para ajudar a configurar o restante do espaço
de trabalho, o Gateway, os canais e outros recursos opcionais; ele também fica disponível
posteriormente em Settings → Crestodian.
</Step>
<Step title="Permissões">

<Frame caption="Escolha quais permissões você deseja conceder ao OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

A integração solicita permissões de TCC para: Automação (AppleScript), Notificações, Acessibilidade, Gravação de Tela, Microfone, Reconhecimento de Fala, Câmera e Localização.

</Step>
<Step title="Concluir">
  Depois que a inferência é aprovada, o Crestodian assume o restante da configuração
  opcional e pode encaminhar você para a conversa normal com o agente. A conclusão do
  passo a passo de permissões abre essa mesma conversa; o aplicativo não cria um espaço
  de trabalho nem inicia uma conversa separada de configuração do agente antes do
  Crestodian. Consulte [Inicialização](/pt-BR/start/bootstrapping) para saber o que acontece
  no host do Gateway durante a primeira interação real do agente.
</Step>
</Steps>

## Relacionado

- [Visão geral da integração](/pt-BR/start/onboarding-overview)
- [Primeiros passos](/pt-BR/start/getting-started)
