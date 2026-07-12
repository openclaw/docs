---
read_when:
    - Projetando o assistente de integração do macOS
    - Implementando a configuração de autenticação ou identidade
sidebarTitle: 'Onboarding: macOS App'
summary: Fluxo de configuração inicial do OpenClaw (aplicativo para macOS)
title: Integração inicial (aplicativo para macOS)
x-i18n:
    generated_at: "2026-07-12T15:46:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cced671a375bd80cbdf920383add8cf01f75a85259963a4286e9ce49913d8b47
    source_path: start/onboarding.md
    workflow: 16
---

O fluxo de primeira execução do aplicativo para macOS: escolha onde o Gateway será executado, conecte um
backend de IA verificado, conceda permissões e passe o controle para o ritual de
bootstrap do próprio agente.
Para conhecer a integração pela CLI e comparar os dois caminhos, consulte [Visão geral da integração](/pt-BR/start/onboarding-overview).

<Steps>
<Step title="Aprovar o aviso do macOS">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Aprovar a busca por redes locais">
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
- Por padrão, a integração local define `tools.profile: "coding"` nas novas configurações, para que instalações novas mantenham as ferramentas de sistema de arquivos e de runtime sem o perfil irrestrito `full`.
- Se hooks/webhooks ou outras fontes de conteúdo não confiável estiverem habilitados, use uma categoria de modelo moderno e robusto e mantenha políticas de ferramentas e isolamento em sandbox rigorosos.

</Step>
<Step title="Local ou remoto">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Onde o **Gateway** será executado?

- **Neste Mac (somente local):** a integração configura a autenticação e grava as credenciais localmente.
- **Remoto (via SSH/Tailnet):** a integração **não** configura a autenticação local;
  as credenciais já devem existir no host do Gateway. O campo de token do Gateway
  remoto armazena o token usado pelo aplicativo para macOS para se conectar a esse Gateway;
  os valores SecretRef existentes de `gateway.remote.token` são preservados até que você
  os substitua.
- **Configurar mais tarde:** ignore a configuração e deixe o aplicativo sem configurar.

<Tip>
**Dica de autenticação do Gateway:**

- O modo de autenticação do Gateway usa `token` por padrão, mesmo para associações de loopback; portanto, clientes WS locais precisam se autenticar.
- Definir `gateway.auth.mode: "none"` permite que qualquer processo local se conecte; use isso somente em máquinas totalmente confiáveis.
- Use um token para acesso entre várias máquinas ou associações que não sejam de loopback.

</Tip>
</Step>
<Step title="CLI">
  A configuração local instala a CLI global `openclaw` por meio do npm, pnpm ou bun,
  priorizando o npm. O Node continua sendo o runtime recomendado para o próprio Gateway.
  Instalações compatíveis existentes são reutilizadas.
</Step>
<Step title="Conecte sua IA">
  Um Gateway conectado que já tenha um modelo de agente configurado ignora esta
  página por completo e abre a interface normal do agente. A configuração do Crestodian
  e do provedor só é executada para um Gateway novo ou incompleto.

Quando o Gateway estiver pronto, a integração procurará acessos de IA que você já tenha:
um login do Claude Code ou Codex, ou `OPENAI_API_KEY` /
`ANTHROPIC_API_KEY`. A melhor opção é testada com uma conclusão real e
só é salva depois de responder; quando um teste falha, o aplicativo tenta
automaticamente a próxima opção e mostra por que a anterior falhou. Se várias opções
forem encontradas, você poderá alternar entre elas antes de continuar.

A Gemini CLI continua disponível para agentes normais após a configuração, mas não é
oferecida aqui porque não consegue aplicar a sondagem de inferência sem ferramentas.

Você também pode entrar por meio do próprio fluxo de OAuth ou pareamento de dispositivo do provedor.
As opções integradas incluem OpenAI/ChatGPT, OpenRouter, GitHub Copilot, Google
Gemini CLI, xAI, MiniMax Global e CN, e Chutes. A lista vem dos
plugins ativos de provedores de inferência de texto do Gateway, em vez de uma lista fixa do aplicativo,
portanto, outro provedor pode optar pela inclusão sem adicionar código específico do provedor para macOS.

O seletor manual de chave/token usa o mesmo registro de provedores. Em todas as rotas,
o provedor fornece seu modelo inicial e sua configuração; o OpenClaw verifica
a credencial com o mesmo teste em tempo real antes de armazenar seu perfil de autenticação. A opção Avançar
permanece bloqueada até que um backend seja aprovado, portanto, a primeira conversa com o agente não pode
começar sem uma inferência funcional. Depois que essa verificação em tempo real é aprovada, o Crestodian fica
disponível para ajudar a configurar o restante do espaço de trabalho, o Gateway, os canais e
outros recursos opcionais; ele também fica disponível posteriormente em Settings → Crestodian.
</Step>
<Step title="Permissões">

<Frame caption="Escolha quais permissões você deseja conceder ao OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

A integração solicita permissões TCC para: Automação (AppleScript), Notificações, Acessibilidade, Gravação de Tela, Microfone, Reconhecimento de Fala, Câmera e Localização.

</Step>
<Step title="Concluir">
  Depois que a inferência é aprovada, o Crestodian assume a configuração opcional restante e pode
  encaminhar você para a conversa normal com o agente. A conclusão do passo a passo de permissões
  abre essa mesma conversa; o aplicativo não cria um espaço de trabalho nem inicia uma conversa
  separada de configuração do agente antes do Crestodian. Consulte
  [Bootstrap](/pt-BR/start/bootstrapping) para saber o que acontece no host do Gateway
  durante a primeira interação real do agente.
</Step>
</Steps>

## Relacionados

- [Visão geral da integração](/pt-BR/start/onboarding-overview)
- [Primeiros passos](/pt-BR/start/getting-started)
