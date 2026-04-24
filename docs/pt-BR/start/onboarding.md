---
read_when:
    - Projetando o assistente de onboarding do macOS
    - Implementando configuração de autenticação ou identidade
sidebarTitle: 'Onboarding: macOS App'
summary: Fluxo de configuração da primeira execução do OpenClaw (app macOS)
title: Onboarding (app macOS)
x-i18n:
    generated_at: "2026-04-24T06:13:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa516f8f5b4c7318f27a5af4e7ac12f5685aef6f84579a68496c2497d6f9041d
    source_path: start/onboarding.md
    workflow: 15
---

Este documento descreve o fluxo **atual** de configuração da primeira execução. O objetivo é uma
experiência suave de “dia 0”: escolher onde o Gateway será executado, conectar autenticação, executar o
assistente e deixar o agente se inicializar sozinho.
Para uma visão geral dos caminhos de onboarding, consulte [Onboarding Overview](/pt-BR/start/onboarding-overview).

<Steps>
<Step title="Approve macOS warning">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Approve find local networks">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="Welcome and security notice">
<Frame caption="Read the security notice displayed and decide accordingly">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Modelo de confiança de segurança:

- Por padrão, o OpenClaw é um agente pessoal: um único limite de operador confiável.
- Configurações compartilhadas/multiusuário exigem bloqueio rigoroso (separe limites de confiança, mantenha o acesso a ferramentas mínimo e siga [Security](/pt-BR/gateway/security)).
- O onboarding local agora usa por padrão `tools.profile: "coding"` em novas configurações, para que configurações locais novas mantenham ferramentas de sistema de arquivos/runtime sem forçar o perfil irrestrito `full`.
- Se hooks/webhooks ou outras fontes de conteúdo não confiável estiverem ativados, use uma camada forte e moderna de modelo e mantenha política de ferramentas/sandboxing rigorosos.

</Step>
<Step title="Local vs Remote">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Onde o **Gateway** é executado?

- **Este Mac (somente local):** o onboarding pode configurar autenticação e gravar credenciais localmente.
- **Remoto (via SSH/Tailnet):** o onboarding **não** configura autenticação local; as credenciais devem existir no host do gateway.
- **Configurar depois:** ignora a configuração e deixa o app sem configurar.

<Tip>
**Dica de autenticação do Gateway:**

- O assistente agora gera um **token** mesmo para loopback, então clientes WS locais precisam se autenticar.
- Se você desativar a autenticação, qualquer processo local poderá se conectar; use isso apenas em máquinas totalmente confiáveis.
- Use um **token** para acesso em várias máquinas ou binds não loopback.

</Tip>
</Step>
<Step title="Permissions">
<Frame caption="Choose what permissions do you want to give OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

O onboarding solicita permissões TCC necessárias para:

- Automation (AppleScript)
- Notifications
- Accessibility
- Screen Recording
- Microphone
- Speech Recognition
- Camera
- Location

</Step>
<Step title="CLI">
  <Info>Esta etapa é opcional</Info>
  O app pode instalar a CLI global `openclaw` via npm, pnpm ou bun.
  Ele prefere npm primeiro, depois pnpm e depois bun se esse for o único
  gerenciador de pacotes detectado. Para o runtime do Gateway, Node continua sendo o caminho recomendado.
</Step>
<Step title="Onboarding Chat (dedicated session)">
  Após a configuração, o app abre uma sessão dedicada de chat de onboarding para que o agente possa
  se apresentar e orientar os próximos passos. Isso mantém a orientação da primeira execução separada
  da sua conversa normal. Consulte [Bootstrapping](/pt-BR/start/bootstrapping) para ver
  o que acontece no host do gateway durante a primeira execução do agente.
</Step>
</Steps>

## Relacionado

- [Visão geral do onboarding](/pt-BR/start/onboarding-overview)
- [Primeiros passos](/pt-BR/start/getting-started)
