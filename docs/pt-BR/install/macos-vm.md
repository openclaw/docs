---
read_when:
    - Você quer manter o OpenClaw isolado do seu ambiente principal do macOS
    - Você quer integrar o iMessage em um sandbox
    - Você quer um ambiente macOS que possa ser redefinido e clonado
    - Você quer comparar opções de VM macOS locais e hospedadas
summary: Execute o OpenClaw em uma VM macOS isolada (local ou hospedada) quando precisar de isolamento ou do iMessage
title: VMs do macOS
x-i18n:
    generated_at: "2026-07-12T00:05:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e6b963faaf40f65adce1081715bc295059b8bed278a8c71a05a86e04ad7a7a5
    source_path: install/macos-vm.md
    workflow: 16
---

## Padrão recomendado (maioria dos usuários)

- **VPS Linux pequeno** para um Gateway sempre ativo e de baixo custo. Consulte [Hospedagem em VPS](/pt-BR/vps).
- **Hardware dedicado** (Mac mini ou máquina Linux) se você quiser controle total e um **IP residencial** para automação do navegador. Muitos sites bloqueiam IPs de data centers, portanto a navegação local geralmente funciona melhor.
- **Híbrido**: mantenha o Gateway em um VPS barato e conecte seu Mac como um **Node** quando precisar de automação do navegador/interface. Consulte [Nodes](/pt-BR/nodes) e [Gateway remoto](/pt-BR/gateway/remote).

Use uma VM macOS somente quando precisar especificamente de recursos exclusivos do macOS, como iMessage, ou quiser isolamento rigoroso do seu Mac de uso diário.

## Opções de VM macOS

### VM local no seu Mac com Apple Silicon (Lume)

Execute o OpenClaw em uma VM macOS isolada no seu Mac com Apple Silicon existente usando o [Lume](https://cua.ai/docs/lume). Isso oferece:

- Ambiente macOS completo e isolado (seu sistema hospedeiro permanece limpo)
- Suporte ao iMessage via `imsg`; o caminho local padrão é impossível no Linux/Windows
- Redefinição instantânea por meio da clonagem de VMs
- Nenhum custo adicional com hardware ou nuvem

### Provedores de Mac hospedado (nuvem)

Se você quiser o macOS na nuvem, provedores de Mac hospedado também funcionam:

- [MacStadium](https://www.macstadium.com/) (Macs hospedados)
- Outros fornecedores de Mac hospedado também funcionam; siga a documentação deles sobre VM e SSH

Quando tiver acesso SSH a uma VM macOS, prossiga para [Instalar o OpenClaw](#6-install-openclaw) abaixo.

## Caminho rápido (Lume, usuários experientes)

1. Instale o Lume.
2. `lume create openclaw --os macos --ipsw latest`
3. Conclua o Assistente de Configuração e ative Remote Login (SSH).
4. `lume run openclaw --no-display`
5. Acesse via SSH, instale o OpenClaw e configure os canais.
6. Pronto.

## O que você precisa (Lume)

- Mac com Apple Silicon (M1/M2/M3/M4)
- macOS Sequoia ou posterior no sistema hospedeiro
- Cerca de 60 GB de espaço livre em disco por VM
- Cerca de 20 minutos

## 1) Instalar o Lume

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

## 2) Criar a VM macOS

```bash
lume create openclaw --os macos --ipsw latest
```

Isso baixa o macOS e cria a VM. Uma janela VNC é aberta automaticamente.

<Note>
O download pode demorar, dependendo da sua conexão.
</Note>

## 3) Concluir o Assistente de Configuração

Na janela VNC:

1. Selecione o idioma e a região.
2. Ignore o Apple ID (ou inicie sessão se quiser usar o iMessage posteriormente).
3. Crie uma conta de usuário (lembre-se do nome de usuário e da senha).
4. Ignore todos os recursos opcionais.

Após concluir a configuração:

1. Ative o SSH: System Settings -> General -> Sharing e ative "Remote Login".
2. Para usar a VM sem interface gráfica, ative o início de sessão automático: System Settings -> Users & Groups, selecione "Automatically log in as:" e escolha o usuário da VM.

## 4) Obter o endereço IP da VM

```bash
lume get openclaw
```

Procure o endereço IP (geralmente `192.168.64.x`).

## 5) Acessar a VM via SSH

```bash
ssh youruser@192.168.64.X
```

Substitua `youruser` pela conta que você criou e o IP pelo endereço IP da sua VM.

## 6) Instalar o OpenClaw

Dentro da VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Siga as instruções de integração para configurar o provedor do seu modelo (Anthropic, OpenAI etc.).

## 7) Configurar os canais

Edite o arquivo de configuração:

```bash
nano ~/.openclaw/openclaw.json
```

Adicione seus canais:

```json5
{
  channels: {
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
  },
}
```

Em seguida, inicie sessão no WhatsApp (escaneie o código QR):

```bash
openclaw channels login
```

## 8) Executar a VM sem interface gráfica

Pare a VM e reinicie-a sem exibição:

```bash
lume stop openclaw
lume run openclaw --no-display
```

A VM é executada em segundo plano; o daemon do OpenClaw mantém o Gateway em execução. Para verificar o status:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

## Bônus: integração com o iMessage

Este é o principal diferencial de executar no macOS. Use o [iMessage](/pt-BR/channels/imessage) com `imsg` para adicionar o Mensagens ao OpenClaw.

Dentro da VM:

1. Inicie sessão no Mensagens.
2. Instale o `imsg`.
3. Conceda acesso total ao disco e permissão de automação ao processo que executa o OpenClaw/`imsg`.
4. Verifique o suporte a RPC com `imsg rpc --help`.

Adicione à configuração do OpenClaw:

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

Reinicie o Gateway. Agora seu agente pode enviar e receber iMessages. Detalhes completos da configuração: [Canal do iMessage](/pt-BR/channels/imessage).

## Salvar uma imagem de referência

Antes de fazer outras personalizações, crie um snapshot do estado limpo:

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

## Execução 24 horas por dia, 7 dias por semana

Mantenha a VM em execução:

- Mantendo seu Mac conectado à energia
- Desativando o repouso em System Settings -> Energy Saver
- Usando `caffeinate`, se necessário

Para uma operação realmente contínua, considere um Mac mini dedicado ou um VPS pequeno. Consulte [Hospedagem em VPS](/pt-BR/vps).

## Solução de problemas

| Problema                         | Solução                                                                                                  |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Não é possível acessar a VM por SSH | Verifique se "Remote Login" está ativado em System Settings da VM                                      |
| O IP da VM não aparece           | Aguarde a inicialização completa da VM e execute `lume get openclaw` novamente                            |
| Comando Lume não encontrado      | Adicione `~/.local/bin` ao seu PATH                                                                       |
| O QR do WhatsApp não é escaneado | Verifique se você iniciou sessão na VM (e não no sistema hospedeiro) ao executar `openclaw channels login` |

## Documentação relacionada

- [Hospedagem em VPS](/pt-BR/vps)
- [Nodes](/pt-BR/nodes)
- [Gateway remoto](/pt-BR/gateway/remote)
- [Canal do iMessage](/pt-BR/channels/imessage)
- [Início rápido do Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Referência da CLI do Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Configuração autônoma de VM](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (avançado)
- [Isolamento com Docker](/pt-BR/install/docker) (abordagem alternativa de isolamento)
