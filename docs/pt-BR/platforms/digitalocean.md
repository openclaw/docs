---
read_when:
    - Configurando o OpenClaw na DigitalOcean
    - Procurando hospedagem VPS barata para OpenClaw
summary: OpenClaw na DigitalOcean (opção simples de VPS paga)
title: DigitalOcean (plataforma)
x-i18n:
    generated_at: "2026-04-30T09:57:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13df486b81590d6350f4b33f5460069fee21881631970d5f4ae34f6ce956407e
    source_path: platforms/digitalocean.md
    workflow: 16
---

# OpenClaw na DigitalOcean

## Objetivo

Execute um OpenClaw Gateway persistente na DigitalOcean por **US$ 6/mês** (ou US$ 4/mês com preço reservado).

Se você quiser uma opção de US$ 0/mês e não se importar com ARM + configuração específica do provedor, consulte o [guia da Oracle Cloud](/pt-BR/install/oracle).

## Comparação de custos (2026)

| Provedor     | Plano            | Especificações          | Preço/mês   | Observações                          |
| ------------ | --------------- | ----------------------- | ----------- | ------------------------------------ |
| Oracle Cloud | ARM Sempre gratuito | até 4 OCPU, 24 GB de RAM | US$ 0       | ARM, capacidade limitada / peculiaridades no cadastro |
| Hetzner      | CX22            | 2 vCPU, 4 GB de RAM     | €3,79 (~US$ 4) | Opção paga mais barata               |
| DigitalOcean | Basic           | 1 vCPU, 1 GB de RAM     | US$ 6       | UI fácil, boa documentação           |
| Vultr        | Cloud Compute   | 1 vCPU, 1 GB de RAM     | US$ 6       | Muitas localidades                   |
| Linode       | Nanode          | 1 vCPU, 1 GB de RAM     | US$ 5       | Agora parte da Akamai                |

**Escolhendo um provedor:**

- DigitalOcean: UX mais simples + configuração previsível (este guia)
- Hetzner: bom preço/desempenho (consulte o [guia da Hetzner](/pt-BR/install/hetzner))
- Oracle Cloud: pode ser US$ 0/mês, mas é mais instável e somente ARM (consulte o [guia da Oracle](/pt-BR/install/oracle))

---

## Pré-requisitos

- Conta da DigitalOcean ([cadastre-se com US$ 200 de crédito grátis](https://m.do.co/c/signup))
- Par de chaves SSH (ou disposição para usar autenticação por senha)
- ~20 minutos

## 1) Crie uma Droplet

<Warning>
Use uma imagem base limpa (Ubuntu 24.04 LTS). Evite imagens de 1 clique de terceiros do Marketplace, a menos que você tenha revisado os scripts de inicialização e os padrões de firewall delas.
</Warning>

1. Entre na [DigitalOcean](https://cloud.digitalocean.com/)
2. Clique em **Create → Droplets**
3. Escolha:
   - **Região:** A mais próxima de você (ou dos seus usuários)
   - **Imagem:** Ubuntu 24.04 LTS
   - **Tamanho:** Basic → Regular → **US$ 6/mês** (1 vCPU, 1 GB de RAM, 25 GB SSD)
   - **Autenticação:** Chave SSH (recomendado) ou senha
4. Clique em **Create Droplet**
5. Anote o endereço IP

## 2) Conecte via SSH

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) Instale o OpenClaw

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Install OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Verify
openclaw --version
```

## 4) Execute o onboarding

```bash
openclaw onboard --install-daemon
```

O assistente guiará você por:

- Autenticação do modelo (chaves de API ou OAuth)
- Configuração de canais (Telegram, WhatsApp, Discord etc.)
- Token do Gateway (gerado automaticamente)
- Instalação do daemon (systemd)

## 5) Verifique o Gateway

```bash
# Check status
openclaw status

# Check service
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 6) Acesse o painel

O Gateway se vincula ao loopback por padrão. Para acessar a Control UI:

**Opção A: túnel SSH (recomendado)**

```bash
# From your local machine
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Then open: http://localhost:18789
```

**Opção B: Tailscale Serve (HTTPS, somente loopback)**

```bash
# On the droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Configure Gateway to use Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

Abra: `https://<magicdns>/`

Observações:

- O Serve mantém o Gateway somente em loopback e autentica o tráfego da Control UI/WebSocket por meio de cabeçalhos de identidade do Tailscale (autenticação sem token presume um host de gateway confiável; APIs HTTP não usam esses cabeçalhos do Tailscale e, em vez disso, seguem o modo normal de autenticação HTTP do gateway).
- Para exigir credenciais explícitas de segredo compartilhado em vez disso, defina `gateway.auth.allowTailscale: false` e use `gateway.auth.mode: "token"` ou `"password"`.

**Opção C: vínculo à tailnet (sem Serve)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

Abra: `http://<tailscale-ip>:18789` (token obrigatório).

## 7) Conecte seus canais

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# Scan QR code
```

Consulte [Canais](/pt-BR/channels) para outros provedores.

---

## Otimizações para 1 GB de RAM

A droplet de US$ 6 tem apenas 1 GB de RAM. Para manter tudo funcionando sem problemas:

### Adicione swap (recomendado)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Use um modelo mais leve

Se você estiver encontrando OOMs, considere:

- Usar modelos baseados em API (Claude, GPT) em vez de modelos locais
- Definir `agents.defaults.model.primary` para um modelo menor

### Monitore a memória

```bash
free -h
htop
```

---

## Persistência

Todo o estado fica em:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` por agente, estado de canais/provedores e dados de sessão
- `~/.openclaw/workspace/` — workspace (SOUL.md, memória etc.)

Eles sobrevivem a reinicializações. Faça backup periodicamente:

```bash
openclaw backup create
```

---

## Alternativa gratuita da Oracle Cloud

A Oracle Cloud oferece instâncias ARM **Always Free** que são significativamente mais poderosas do que qualquer opção paga aqui — por US$ 0/mês.

| O que você recebe | Especificações         |
| ----------------- | ---------------------- |
| **4 OCPUs**       | ARM Ampere A1          |
| **24 GB de RAM**  | Mais que suficiente    |
| **200 GB de armazenamento** | Volume em bloco |
| **Grátis para sempre** | Sem cobranças no cartão de crédito |

**Ressalvas:**

- O cadastro pode ser instável (tente novamente se falhar)
- Arquitetura ARM — a maioria das coisas funciona, mas alguns binários precisam de builds ARM

Para o guia completo de configuração, consulte [Oracle Cloud](/pt-BR/install/oracle). Para dicas de cadastro e solução de problemas no processo de inscrição, consulte este [guia da comunidade](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd).

---

## Solução de problemas

### O Gateway não inicia

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service --no-pager -n 50
```

### Porta já em uso

```bash
lsof -i :18789
kill <PID>
```

### Sem memória

```bash
# Check memory
free -h

# Add more swap
# Or upgrade to $12/mo droplet (2GB RAM)
```

---

## Relacionados

- [Guia da Hetzner](/pt-BR/install/hetzner) — mais barato, mais poderoso
- [Instalação com Docker](/pt-BR/install/docker) — configuração em contêiner
- [Tailscale](/pt-BR/gateway/tailscale) — acesso remoto seguro
- [Configuração](/pt-BR/gateway/configuration) — referência completa de configuração
