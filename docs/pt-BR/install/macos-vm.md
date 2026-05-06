---
read_when:
    - Você quer manter o OpenClaw isolado do seu ambiente macOS principal
    - Você quer a integração com iMessage (BlueBubbles) em um ambiente isolado
    - Você quer um ambiente macOS redefinível que você possa clonar
    - Você quer comparar opções de VM macOS locais versus hospedadas
summary: Execute o OpenClaw em uma VM macOS em sandbox (local ou hospedada) quando precisar de isolamento ou do iMessage
title: Máquinas virtuais do macOS
x-i18n:
    generated_at: "2026-05-06T06:01:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2b6841f66e63606346f364bb1b1b9ca4a3d52558e3d8c6f129c5b89387c6968
    source_path: install/macos-vm.md
    workflow: 16
---

## Padrão recomendado (maioria dos usuários)

- **VPS Linux pequena** para um Gateway sempre ativo e baixo custo. Consulte [hospedagem em VPS](/pt-BR/vps).
- **Hardware dedicado** (Mac mini ou máquina Linux) se você quiser controle total e um **IP residencial** para automação de navegador. Muitos sites bloqueiam IPs de data center, então a navegação local costuma funcionar melhor.
- **Híbrido:** mantenha o Gateway em uma VPS barata e conecte seu Mac como um **Node** quando precisar de automação de navegador/UI. Consulte [Nodes](/pt-BR/nodes) e [Gateway remoto](/pt-BR/gateway/remote).

Use uma VM macOS quando você precisar especificamente de recursos exclusivos do macOS (iMessage/BlueBubbles) ou quiser isolamento rigoroso do seu Mac diário.

## Opções de VM macOS

### VM local no seu Mac Apple Silicon (Lume)

Execute o OpenClaw em uma VM macOS isolada no seu Mac Apple Silicon existente usando o [Lume](https://cua.ai/docs/lume).

Isso oferece:

- Ambiente macOS completo em isolamento (seu host permanece limpo)
- Suporte a iMessage via BlueBubbles (impossível no Linux/Windows)
- Redefinição instantânea ao clonar VMs
- Sem hardware extra ou custos de nuvem

### Provedores de Mac hospedado (nuvem)

Se você quiser macOS na nuvem, provedores de Mac hospedado também funcionam:

- [MacStadium](https://www.macstadium.com/) (Macs hospedados)
- Outros fornecedores de Mac hospedado também funcionam; siga a documentação de VM + SSH deles

Depois de ter acesso SSH a uma VM macOS, continue na etapa 6 abaixo.

---

## Caminho rápido (Lume, usuários experientes)

1. Instale o Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Conclua o Assistente de Configuração, habilite o Login Remoto (SSH)
4. `lume run openclaw --no-display`
5. Acesse via SSH, instale o OpenClaw, configure os canais
6. Pronto

---

## O que você precisa (Lume)

- Mac Apple Silicon (M1/M2/M3/M4)
- macOS Sequoia ou posterior no host
- ~60 GB de espaço livre em disco por VM
- ~20 minutos

---

## 1) Instale o Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Se `~/.local/bin` não estiver no seu PATH:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Verifique:

```bash
lume --version
```

Documentação: [Instalação do Lume](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) Crie a VM macOS

```bash
lume create openclaw --os macos --ipsw latest
```

Isso baixa o macOS e cria a VM. Uma janela VNC abre automaticamente.

<Note>
O download pode demorar um pouco dependendo da sua conexão.
</Note>

---

## 3) Conclua o Assistente de Configuração

Na janela VNC:

1. Selecione idioma e região
2. Pule o Apple ID (ou entre se quiser usar iMessage depois)
3. Crie uma conta de usuário (lembre-se do nome de usuário e da senha)
4. Pule todos os recursos opcionais

Depois que a configuração terminar, habilite SSH:

1. Abra Ajustes do Sistema → Geral → Compartilhamento
2. Habilite "Login Remoto"

---

## 4) Obtenha o endereço IP da VM

```bash
lume get openclaw
```

Procure o endereço IP (geralmente `192.168.64.x`).

---

## 5) Acesse a VM via SSH

```bash
ssh youruser@192.168.64.X
```

Substitua `youruser` pela conta que você criou e o IP pelo IP da sua VM.

---

## 6) Instale o OpenClaw

Dentro da VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Siga os prompts de integração para configurar seu provedor de modelo (Anthropic, OpenAI, etc.).

---

## 7) Configure os canais

Edite o arquivo de configuração:

```bash
nano ~/.openclaw/openclaw.json
```

Adicione seus canais:

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
  },
}
```

Depois faça login no WhatsApp (escaneie o QR):

```bash
openclaw channels login
```

---

## 8) Execute a VM sem interface gráfica

Pare a VM e reinicie sem display:

```bash
lume stop openclaw
lume run openclaw --no-display
```

A VM é executada em segundo plano. O daemon do OpenClaw mantém o gateway em execução.

Para verificar o status:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Bônus: integração com iMessage

Este é o principal recurso de executar no macOS. Use o [BlueBubbles](https://bluebubbles.app) para adicionar iMessage ao OpenClaw.

Dentro da VM:

1. Baixe o BlueBubbles em bluebubbles.app
2. Entre com seu Apple ID
3. Habilite a API Web e defina uma senha
4. Aponte os webhooks do BlueBubbles para seu gateway (exemplo: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

Adicione à sua configuração do OpenClaw:

```json5
{
  channels: {
    bluebubbles: {
      serverUrl: "http://localhost:1234",
      password: "your-api-password",
      webhookPath: "/bluebubbles-webhook",
    },
  },
}
```

Reinicie o gateway. Agora seu agente pode enviar e receber iMessages.

Detalhes completos de configuração: [canal BlueBubbles](/pt-BR/channels/bluebubbles)

---

## Salve uma imagem dourada

Antes de personalizar mais, faça um snapshot do seu estado limpo:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Redefina a qualquer momento:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## Execução 24/7

Mantenha a VM em execução:

- Mantendo seu Mac conectado à energia
- Desabilitando o repouso em Ajustes do Sistema → Economizador de Energia
- Usando `caffeinate` se necessário

Para algo realmente sempre ativo, considere um Mac mini dedicado ou uma VPS pequena. Consulte [hospedagem em VPS](/pt-BR/vps).

---

## Solução de problemas

| Problema                     | Solução                                                                                         |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| Não consigo acessar a VM via SSH | Verifique se "Login Remoto" está habilitado nos Ajustes do Sistema da VM                    |
| IP da VM não aparece         | Aguarde a VM inicializar completamente, execute `lume get openclaw` novamente                    |
| Comando Lume não encontrado  | Adicione `~/.local/bin` ao seu PATH                                                              |
| QR do WhatsApp não escaneia  | Garanta que você esteja logado na VM (não no host) ao executar `openclaw channels login`         |

---

## Documentação relacionada

- [Hospedagem em VPS](/pt-BR/vps)
- [Nodes](/pt-BR/nodes)
- [Gateway remoto](/pt-BR/gateway/remote)
- [Canal BlueBubbles](/pt-BR/channels/bluebubbles)
- [Início rápido do Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Referência da CLI do Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Configuração de VM sem supervisão](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (avançado)
- [Sandboxing com Docker](/pt-BR/install/docker) (abordagem alternativa de isolamento)
