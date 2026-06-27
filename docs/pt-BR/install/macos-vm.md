---
read_when:
    - Você quer o OpenClaw isolado do seu ambiente principal do macOS
    - Você quer integração com iMessage em um sandbox
    - Você quer um ambiente macOS redefinível que possa clonar
    - Você quer comparar opções de VM macOS local vs hospedada
summary: Execute o OpenClaw em uma VM macOS em sandbox (local ou hospedada) quando precisar de isolamento ou iMessage
title: VMs macOS
x-i18n:
    generated_at: "2026-06-27T17:38:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aee2fa0651b711f29d7d092da931bd924bc8ce8a5ca389cf8f189725fa586f3f
    source_path: install/macos-vm.md
    workflow: 16
---

## Padrão recomendado (maioria dos usuários)

- **VPS Linux pequena** para um Gateway sempre ativo e baixo custo. Consulte [Hospedagem em VPS](/pt-BR/vps).
- **Hardware dedicado** (Mac mini ou máquina Linux) se você quiser controle total e um **IP residencial** para automação de navegador. Muitos sites bloqueiam IPs de data centers, então a navegação local costuma funcionar melhor.
- **Híbrido:** mantenha o Gateway em uma VPS barata e conecte seu Mac como um **node** quando precisar de automação de navegador/UI. Consulte [Nodes](/pt-BR/nodes) e [Gateway remoto](/pt-BR/gateway/remote).

Use uma VM macOS quando você precisar especificamente de recursos exclusivos do macOS, como iMessage, ou quiser isolamento rigoroso do seu Mac diário.

## Opções de VM macOS

### VM local no seu Mac Apple Silicon (Lume)

Execute o OpenClaw em uma VM macOS em sandbox no seu Mac Apple Silicon existente usando [Lume](https://cua.ai/docs/lume).

Isso oferece:

- Ambiente macOS completo em isolamento (seu host permanece limpo)
- Suporte a iMessage via `imsg` (o caminho local padrão é impossível no Linux/Windows)
- Redefinição instantânea clonando VMs
- Nenhum custo extra de hardware ou nuvem

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
5. Acesse via SSH, instale o OpenClaw, configure canais
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
O download pode demorar um pouco, dependendo da sua conexão.
</Note>

---

## 3) Conclua o Assistente de Configuração

Na janela VNC:

1. Selecione idioma e região
2. Pule o Apple ID (ou faça login se quiser iMessage depois)
3. Crie uma conta de usuário (lembre-se do nome de usuário e da senha)
4. Pule todos os recursos opcionais

Após a configuração ser concluída:

1. Habilite SSH: abra Ajustes do Sistema -> Geral -> Compartilhamento e habilite "Login Remoto".
2. Para uso da VM sem interface gráfica, habilite login automático: abra Ajustes do Sistema -> Usuários e Grupos, selecione "Iniciar sessão automaticamente como:" e escolha o usuário da VM.

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

Substitua `youruser` pela conta que você criou, e o IP pelo IP da sua VM.

---

## 6) Instale o OpenClaw

Dentro da VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Siga os prompts de onboarding para configurar seu provedor de modelo (Anthropic, OpenAI etc.).

---

## 7) Configure canais

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

A VM roda em segundo plano. O daemon do OpenClaw mantém o Gateway em execução.

Para verificar o status:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Bônus: integração com iMessage

Este é o principal diferencial de executar no macOS. Use [iMessage](/pt-BR/channels/imessage) com `imsg` para adicionar Mensagens ao OpenClaw.

Dentro da VM:

1. Faça login no Mensagens.
2. Instale `imsg`.
3. Conceda permissões de Acesso Total ao Disco e Automação ao processo que executa OpenClaw/`imsg`.
4. Verifique o suporte a RPC com `imsg rpc --help`.

Adicione à sua configuração do OpenClaw:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
    },
  },
}
```

Reinicie o Gateway. Agora seu agente pode enviar e receber iMessages.

Detalhes completos de configuração: [canal iMessage](/pt-BR/channels/imessage)

---

## Salve uma imagem base

Antes de personalizar mais, crie um snapshot do seu estado limpo:

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

## Executando 24/7

Mantenha a VM em execução ao:

- Manter seu Mac conectado à energia
- Desabilitar repouso em Ajustes do Sistema → Economizador de Energia
- Usar `caffeinate` se necessário

Para operação realmente sempre ativa, considere um Mac mini dedicado ou uma VPS pequena. Consulte [Hospedagem em VPS](/pt-BR/vps).

---

## Solução de problemas

| Problema                 | Solução                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Não consigo acessar a VM via SSH | Verifique se "Login Remoto" está habilitado nos Ajustes do Sistema da VM           |
| IP da VM não aparece     | Aguarde a VM inicializar completamente e execute `lume get openclaw` novamente     |
| Comando Lume não encontrado | Adicione `~/.local/bin` ao seu PATH                                                |
| QR do WhatsApp não escaneia | Certifique-se de estar logado na VM (não no host) ao executar `openclaw channels login` |

---

## Documentação relacionada

- [Hospedagem em VPS](/pt-BR/vps)
- [Nodes](/pt-BR/nodes)
- [Gateway remoto](/pt-BR/gateway/remote)
- [Canal iMessage](/pt-BR/channels/imessage)
- [Início rápido do Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Referência da CLI do Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Configuração de VM não supervisionada](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (avançado)
- [Sandboxing com Docker](/pt-BR/install/docker) (abordagem alternativa de isolamento)
