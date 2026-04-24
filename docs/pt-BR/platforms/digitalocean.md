---
read_when:
    - Configurar o OpenClaw no DigitalOcean
    - Procurando hospedagem VPS barata para OpenClaw
summary: OpenClaw no DigitalOcean (opção simples de VPS paga)
title: DigitalOcean (plataforma)
x-i18n:
    generated_at: "2026-04-24T06:00:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9d286f243f38ed910a3229f195be724f9f96481036380d8c8194ff298d39c87
    source_path: platforms/digitalocean.md
    workflow: 15
---

# OpenClaw no DigitalOcean

## Objetivo

Executar um Gateway OpenClaw persistente no DigitalOcean por **US$6/mês** (ou US$4/mês com preço reservado).

Se você quiser uma opção de US$0/mês e não se importar com ARM + configuração específica do provider, consulte o [guia Oracle Cloud](/pt-BR/install/oracle).

## Comparação de custos (2026)

| Provider     | Plano            | Especificações          | Preço/mês   | Observações                           |
| ------------ | ---------------- | ----------------------- | ----------- | ------------------------------------- |
| Oracle Cloud | Always Free ARM  | até 4 OCPU, 24GB RAM    | US$0        | ARM, capacidade limitada / peculiaridades de cadastro |
| Hetzner      | CX22             | 2 vCPU, 4GB RAM         | €3,79 (~US$4) | Opção paga mais barata               |
| DigitalOcean | Basic            | 1 vCPU, 1GB RAM         | US$6        | Interface simples, boa documentação   |
| Vultr        | Cloud Compute    | 1 vCPU, 1GB RAM         | US$6        | Muitas localidades                    |
| Linode       | Nanode           | 1 vCPU, 1GB RAM         | US$5        | Agora parte da Akamai                 |

**Escolhendo um provider:**

- DigitalOcean: UX mais simples + configuração previsível (este guia)
- Hetzner: boa relação preço/desempenho (consulte [guia Hetzner](/pt-BR/install/hetzner))
- Oracle Cloud: pode sair por US$0/mês, mas é mais instável e apenas ARM (consulte [guia Oracle](/pt-BR/install/oracle))

---

## Pré-requisitos

- Conta no DigitalOcean ([cadastro com US$200 de crédito grátis](https://m.do.co/c/signup))
- Par de chaves SSH (ou disposição para usar autenticação por senha)
- ~20 minutos

## 1) Criar um Droplet

<Warning>
Use uma imagem base limpa (Ubuntu 24.04 LTS). Evite imagens de terceiros do Marketplace com 1 clique, a menos que você tenha revisado os scripts de inicialização e os padrões de firewall.
</Warning>

1. Entre no [DigitalOcean](https://cloud.digitalocean.com/)
2. Clique em **Create → Droplets**
3. Escolha:
   - **Region:** a mais próxima de você (ou dos seus usuários)
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic → Regular → **US$6/mês** (1 vCPU, 1GB RAM, 25GB SSD)
   - **Authentication:** chave SSH (recomendado) ou senha
4. Clique em **Create Droplet**
5. Anote o endereço IP

## 2) Conectar via SSH

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) Instalar o OpenClaw

```bash
# Atualizar o sistema
apt update && apt upgrade -y

# Instalar Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Instalar OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Verificar
openclaw --version
```

## 4) Executar o onboarding

```bash
openclaw onboard --install-daemon
```

O assistente vai orientar você em:

- Autenticação de modelo (chaves de API ou OAuth)
- Configuração de canais (Telegram, WhatsApp, Discord etc.)
- Token do Gateway (gerado automaticamente)
- Instalação do daemon (systemd)

## 5) Verificar o Gateway

```bash
# Verificar status
openclaw status

# Verificar serviço
systemctl --user status openclaw-gateway.service

# Ver logs
journalctl --user -u openclaw-gateway.service -f
```

## 6) Acessar o Painel

O gateway faz bind em loopback por padrão. Para acessar a interface do Control:

**Opção A: Túnel SSH (recomendado)**

```bash
# Da sua máquina local
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Depois abra: http://localhost:18789
```

**Opção B: Tailscale Serve (HTTPS, somente loopback)**

```bash
# No droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Configurar Gateway para usar Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

Abra: `https://<magicdns>/`

Observações:

- O Serve mantém o Gateway apenas em loopback e autentica o tráfego da interface do Control/WebSocket via cabeçalhos de identidade do Tailscale (a autenticação sem token pressupõe um host de gateway confiável; APIs HTTP não usam esses cabeçalhos do Tailscale e, em vez disso, seguem o modo normal de autenticação HTTP do gateway).
- Para exigir credenciais explícitas de segredo compartilhado, defina `gateway.auth.allowTailscale: false` e use `gateway.auth.mode: "token"` ou `"password"`.

**Opção C: Bind na tailnet (sem Serve)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

Abra: `http://<tailscale-ip>:18789` (token obrigatório).

## 7) Conectar seus canais

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# Escaneie o QR code
```

Consulte [Canais](/pt-BR/channels) para outros providers.

---

## Otimizações para 1GB de RAM

O droplet de US$6 tem apenas 1GB de RAM. Para manter tudo funcionando com fluidez:

### Adicionar swap (recomendado)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Usar um modelo mais leve

Se você estiver enfrentando OOMs, considere:

- Usar modelos baseados em API (Claude, GPT) em vez de modelos locais
- Definir `agents.defaults.model.primary` como um modelo menor

### Monitorar memória

```bash
free -h
htop
```

---

## Persistência

Todo o estado fica em:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` por agente, estado de canal/provider e dados de sessão
- `~/.openclaw/workspace/` — workspace (`SOUL.md`, memória etc.)

Esses dados sobrevivem a reinicializações. Faça backup periodicamente:

```bash
openclaw backup create
```

---

## Alternativa gratuita com Oracle Cloud

O Oracle Cloud oferece instâncias ARM **Always Free** significativamente mais poderosas do que qualquer opção paga aqui — por US$0/mês.

| O que você recebe | Especificações       |
| ----------------- | -------------------- |
| **4 OCPUs**       | ARM Ampere A1        |
| **24GB RAM**      | Mais que suficiente  |
| **200GB storage** | Volume em bloco      |
| **Grátis para sempre** | Sem cobranças no cartão |

**Ressalvas:**

- O cadastro pode ser instável (tente novamente se falhar)
- Arquitetura ARM — a maioria das coisas funciona, mas alguns binários precisam de builds ARM

Para o guia completo de configuração, consulte [Oracle Cloud](/pt-BR/install/oracle). Para dicas de cadastro e solução de problemas no processo de inscrição, consulte este [guia da comunidade](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd).

---

## Solução de problemas

### Gateway não inicia

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
# Verificar memória
free -h

# Adicionar mais swap
# Ou atualizar para droplet de US$12/mês (2GB RAM)
```

---

## Relacionado

- [Guia Hetzner](/pt-BR/install/hetzner) — mais barato, mais potente
- [Instalação com Docker](/pt-BR/install/docker) — configuração em contêiner
- [Tailscale](/pt-BR/gateway/tailscale) — acesso remoto seguro
- [Configuração](/pt-BR/gateway/configuration) — referência completa de configuração
