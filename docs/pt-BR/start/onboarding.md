---
read_when:
    - Projetando o assistente de integração do macOS
    - Implementando configuração de autenticação ou identidade
sidebarTitle: 'Onboarding: macOS App'
summary: Fluxo de configuração da primeira execução do OpenClaw (aplicativo para macOS)
title: Integração inicial (aplicativo macOS)
x-i18n:
    generated_at: "2026-06-27T18:12:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 73f902bcbb7ef782d4a5fbe442a8855a8fcb426d45167c4d2fc1fc050263b5f1
    source_path: start/onboarding.md
    workflow: 16
---

Este documento descreve o fluxo de configuração de primeira execução **atual**. O objetivo é uma experiência
suave no "dia 0": escolher onde o Gateway é executado, conectar a autenticação, executar o
assistente e deixar o agente inicializar a si mesmo.
Para uma visão geral dos caminhos de integração, consulte [Visão geral da integração](/pt-BR/start/onboarding-overview).

<Steps>
<Step title="Aprovar aviso do macOS">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Aprovar busca por redes locais">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="Boas-vindas e aviso de segurança">
<Frame caption="Leia o aviso de segurança exibido e decida de acordo">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Modelo de confiança de segurança:

- Por padrão, o OpenClaw é um agente pessoal: um limite de operador confiável.
- Configurações compartilhadas/multiusuário exigem bloqueio rigoroso (separe os limites de confiança, mantenha o acesso a ferramentas no mínimo e siga [Segurança](/pt-BR/gateway/security)).
- A integração local agora define novas configurações como `tools.profile: "coding"` por padrão, para que configurações locais novas mantenham ferramentas de sistema de arquivos/runtime sem forçar o perfil irrestrito `full`.
- Se hooks/Webhooks ou outros feeds de conteúdo não confiáveis estiverem ativados, use uma camada de modelo moderna e forte e mantenha uma política de ferramentas/sandboxing rigorosa.

</Step>
<Step title="Local vs remoto">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Onde o **Gateway** é executado?

- **Este Mac (somente local):** a integração pode configurar a autenticação e gravar credenciais
  localmente.
- **Remoto (via SSH/Tailnet):** a integração **não** configura autenticação local;
  as credenciais devem existir no host do gateway. O campo de token do gateway remoto
  armazena o token usado pelo app macOS para se conectar a esse Gateway; valores
  `gateway.remote.token` não existentes em texto puro são preservados até você substituí-los.
- **Configurar depois:** pule a configuração e deixe o app não configurado.

<Tip>
**Dica de autenticação do Gateway:**

- O assistente agora gera um **token** até mesmo para loopback, então clientes WS locais devem se autenticar.
- Se você desativar a autenticação, qualquer processo local poderá se conectar; use isso somente em máquinas totalmente confiáveis.
- Use um **token** para acesso entre várias máquinas ou binds que não sejam de loopback.

</Tip>
</Step>
<Step title="Permissões">
<Frame caption="Escolha quais permissões você deseja conceder ao OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

A integração solicita as permissões TCC necessárias para:

- Automação (AppleScript)
- Notificações
- Acessibilidade
- Gravação de tela
- Microfone
- Reconhecimento de fala
- Câmera
- Localização

</Step>
<Step title="CLI">
  <Info>Esta etapa é opcional</Info>
  O app pode instalar a CLI global `openclaw` via npm, pnpm ou bun.
  Ele prefere npm primeiro, depois pnpm, depois bun se esse for o único
  gerenciador de pacotes detectado. Para o runtime do Gateway, Node continua sendo o caminho recomendado.
</Step>
<Step title="Chat de integração (sessão dedicada)">
  Após a configuração, o app abre uma sessão de chat de integração dedicada para que o agente possa
  se apresentar e orientar os próximos passos. Isso mantém a orientação de primeira execução separada
  da sua conversa normal. Consulte [Inicialização](/pt-BR/start/bootstrapping) para
  o que acontece no host do gateway durante a primeira execução do agente.
</Step>
</Steps>

## Relacionados

- [Visão geral da integração](/pt-BR/start/onboarding-overview)
- [Primeiros passos](/pt-BR/start/getting-started)
