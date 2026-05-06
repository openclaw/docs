---
read_when:
    - Projetando o assistente de integração inicial do macOS
    - Implementando a configuração de autenticação ou identidade
sidebarTitle: 'Onboarding: macOS App'
summary: Fluxo de configuração da primeira execução do OpenClaw (aplicativo para macOS)
title: Integração (app para macOS)
x-i18n:
    generated_at: "2026-05-06T09:14:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6dc7ebea5de7b1398d7b64c00245255c59af8a7ef51315cdd0ef1cb4898a41a4
    source_path: start/onboarding.md
    workflow: 16
---

Este documento descreve o fluxo de configuração de primeira execução **atual**. O objetivo é uma experiência fluida de "dia 0": escolher onde o Gateway é executado, conectar a autenticação, executar o assistente e permitir que o agente inicialize a si mesmo.
Para uma visão geral dos caminhos de onboarding, consulte [Visão geral do onboarding](/pt-BR/start/onboarding-overview).

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
- Configurações compartilhadas/multiusuário exigem bloqueio (separe os limites de confiança, mantenha o acesso a ferramentas mínimo e siga [Segurança](/pt-BR/gateway/security)).
- O onboarding local agora define novas configurações como `tools.profile: "coding"` por padrão, para que novas configurações locais mantenham ferramentas de sistema de arquivos/runtime sem forçar o perfil `full` irrestrito.
- Se hooks/webhooks ou outros feeds de conteúdo não confiável estiverem habilitados, use uma camada de modelo moderna e forte e mantenha uma política de ferramentas/sandboxing rigorosa.

</Step>
<Step title="Local vs Remoto">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Onde o **Gateway** é executado?

- **Este Mac (somente local):** o onboarding pode configurar a autenticação e gravar credenciais localmente.
- **Remoto (via SSH/Tailnet):** o onboarding **não** configura autenticação local; as credenciais devem existir no host do gateway.
- **Configurar depois:** pule a configuração e deixe o app sem configuração.

<Tip>
**Dica de autenticação do Gateway:**

- O assistente agora gera um **token** mesmo para loopback, portanto clientes WS locais precisam se autenticar.
- Se você desabilitar a autenticação, qualquer processo local poderá se conectar; use isso somente em máquinas totalmente confiáveis.
- Use um **token** para acesso entre várias máquinas ou binds que não sejam de loopback.

</Tip>
</Step>
<Step title="Permissões">
<Frame caption="Escolha quais permissões você quer conceder ao OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

O onboarding solicita as permissões TCC necessárias para:

- Automação (AppleScript)
- Notificações
- Acessibilidade
- Gravação de Tela
- Microfone
- Reconhecimento de Fala
- Câmera
- Localização

</Step>
<Step title="CLI">
  <Info>Esta etapa é opcional</Info>
  O app pode instalar a CLI global `openclaw` via npm, pnpm ou bun.
  Ele prefere npm primeiro, depois pnpm e, em seguida, bun se esse for o único
  gerenciador de pacotes detectado. Para o runtime do Gateway, Node continua sendo o caminho recomendado.
</Step>
<Step title="Chat de Onboarding (sessão dedicada)">
  Após a configuração, o app abre uma sessão de chat de onboarding dedicada para que o agente possa
  se apresentar e orientar os próximos passos. Isso mantém a orientação de primeira execução separada
  da sua conversa normal. Consulte [Inicialização](/pt-BR/start/bootstrapping) para
  saber o que acontece no host do gateway durante a primeira execução do agente.
</Step>
</Steps>

## Relacionados

- [Visão geral do onboarding](/pt-BR/start/onboarding-overview)
- [Introdução](/pt-BR/start/getting-started)
