---
read_when:
    - Configurando o OpenClaw na Oracle Cloud
    - Procurando hospedagem VPS de baixo custo para o OpenClaw
    - Quer o OpenClaw 24/7 em um servidor pequeno
summary: OpenClaw na Oracle Cloud (ARM sempre gratuito)
title: Oracle Cloud (plataforma)
x-i18n:
    generated_at: "2026-04-30T09:58:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: d86af91bd924ad08535a21fa481ce551e8c19f1a6cd82b61c335da7a068a09f0
    source_path: platforms/oracle.md
    workflow: 16
---

# OpenClaw na Oracle Cloud (OCI)

## Objetivo

Execute um Gateway OpenClaw persistente no nível ARM **Always Free** da Oracle Cloud.

O nível gratuito da Oracle pode ser uma ótima opção para o OpenClaw (especialmente se você já tem uma conta OCI), mas ele tem alguns tradeoffs:

- Arquitetura ARM (a maioria das coisas funciona, mas alguns binários podem ser somente x86)
- Capacidade e cadastro podem ser instáveis

## Comparação de custo (2026)

| Provedor     | Plano           | Especificações         | Preço/mês | Observações                |
| ------------ | --------------- | ---------------------- | --------- | -------------------------- |
| Oracle Cloud | Always Free ARM | até 4 OCPU, 24GB RAM   | $0        | ARM, capacidade limitada   |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM        | ~ $4      | Opção paga mais barata     |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM        | $6        | UI fácil, boa documentação |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM        | $6        | Muitas localidades         |
| Linode       | Nanode          | 1 vCPU, 1GB RAM        | $5        | Agora parte da Akamai      |

---

## Pré-requisitos

- Conta Oracle Cloud ([cadastro](https://www.oracle.com/cloud/free/)) — veja o [guia de cadastro da comunidade](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) se tiver problemas
- Conta Tailscale (gratuita em [tailscale.com](https://tailscale.com))
- ~30 minutos

## 1) Crie uma instância OCI

1. Entre no [Oracle Cloud Console](https://cloud.oracle.com/)
2. Navegue até **Compute → Instances → Create Instance**
3. Configure:
   - **Nome:** `openclaw`
   - **Imagem:** Ubuntu 24.04 (aarch64)
   - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPUs:** 2 (ou até 4)
   - **Memória:** 12 GB (ou até 24 GB)
   - **Volume de inicialização:** 50 GB (até 200 GB grátis)
   - **Chave SSH:** Adicione sua chave pública
4. Clique em **Create**
5. Anote o endereço IP público

**Dica:** Se a criação da instância falhar com "Out of capacity", tente outro domínio de disponibilidade ou tente novamente mais tarde. A capacidade do nível gratuito é limitada.

## 2) Conecte e atualize

```bash
# Connect via public IP
ssh ubuntu@YOUR_PUBLIC_IP

# Update system
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**Observação:** `build-essential` é necessário para a compilação ARM de algumas dependências.

## 3) Configure o usuário e o hostname

```bash
# Set hostname
sudo hostnamectl set-hostname openclaw

# Set password for ubuntu user
sudo passwd ubuntu

# Enable lingering (keeps user services running after logout)
sudo loginctl enable-linger ubuntu
```

## 4) Instale o Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

Isso ativa o SSH do Tailscale, para que você possa se conectar via `ssh openclaw` de qualquer dispositivo na sua tailnet — sem precisar de IP público.

Verifique:

```bash
tailscale status
```

**De agora em diante, conecte via Tailscale:** `ssh ubuntu@openclaw` (ou use o IP do Tailscale).

## 5) Instale o OpenClaw

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

Quando perguntado "How do you want to hatch your bot?", selecione **"Do this later"**.

> Observação: se você tiver problemas de build nativo em ARM, comece pelos pacotes do sistema (por exemplo, `sudo apt install -y build-essential`) antes de recorrer ao Homebrew.

## 6) Configure o Gateway (loopback + autenticação por token) e ative o Tailscale Serve

Use autenticação por token como padrão. Ela é previsível e evita a necessidade de qualquer flag de UI de Controle de “autenticação insegura”.

```bash
# Keep the Gateway private on the VM
openclaw config set gateway.bind loopback

# Require auth for the Gateway + Control UI
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Expose over Tailscale Serve (HTTPS + tailnet access)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

`gateway.trustedProxies=["127.0.0.1"]` aqui serve apenas para o tratamento de IP encaminhado/cliente local do proxy local do Tailscale Serve. Ele **não** é `gateway.auth.mode: "trusted-proxy"`. Rotas do visualizador de diffs mantêm comportamento de falha fechada nessa configuração: solicitações brutas do visualizador em `127.0.0.1` sem cabeçalhos de proxy encaminhados podem retornar `Diff not found`. Use `mode=file` / `mode=both` para anexos, ou ative intencionalmente visualizadores remotos e defina `plugins.entries.diffs.config.viewerBaseUrl` (ou passe um `baseUrl` de proxy) se precisar de links compartilháveis do visualizador.

## 7) Verifique

```bash
# Check version
openclaw --version

# Check daemon status
systemctl --user status openclaw-gateway.service

# Check Tailscale Serve
tailscale serve status

# Test local response
curl http://localhost:18789
```

## 8) Bloqueie a segurança da VCN

Agora que tudo está funcionando, bloqueie a VCN para impedir todo o tráfego, exceto Tailscale. A Virtual Cloud Network da OCI atua como um firewall na borda da rede — o tráfego é bloqueado antes de chegar à sua instância.

1. Vá para **Networking → Virtual Cloud Networks** no Console OCI
2. Clique na sua VCN → **Security Lists** → Default Security List
3. **Remova** todas as regras de entrada, exceto:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. Mantenha as regras de saída padrão (permitir todo tráfego de saída)

Isso bloqueia SSH na porta 22, HTTP, HTTPS e todo o resto na borda da rede. De agora em diante, você só pode se conectar via Tailscale.

---

## Acesse a UI de Controle

De qualquer dispositivo na sua rede Tailscale:

```
https://openclaw.<tailnet-name>.ts.net/
```

Substitua `<tailnet-name>` pelo nome da sua tailnet (visível em `tailscale status`).

Nenhum túnel SSH é necessário. O Tailscale fornece:

- Criptografia HTTPS (certificados automáticos)
- Autenticação via identidade Tailscale
- Acesso de qualquer dispositivo na sua tailnet (notebook, celular etc.)

---

## Segurança: VCN + Tailscale (baseline recomendado)

Com a VCN bloqueada (somente UDP 41641 aberta) e o Gateway vinculado ao loopback, você obtém uma forte defesa em profundidade: o tráfego público é bloqueado na borda da rede, e o acesso administrativo acontece pela sua tailnet.

Essa configuração frequentemente elimina a _necessidade_ de regras extras de firewall no host apenas para impedir força bruta de SSH vinda de toda a Internet — mas você ainda deve manter o SO atualizado, executar `openclaw security audit` e verificar se não está escutando acidentalmente em interfaces públicas.

### Já protegido

| Etapa tradicional      | Necessária?     | Por quê                                                                    |
| ---------------------- | --------------- | -------------------------------------------------------------------------- |
| Firewall UFW           | Não             | A VCN bloqueia antes que o tráfego alcance a instância                     |
| fail2ban               | Não             | Não há força bruta se a porta 22 estiver bloqueada na VCN                  |
| Reforço do sshd        | Não             | O SSH do Tailscale não usa sshd                                            |
| Desativar login root   | Não             | O Tailscale usa identidade Tailscale, não usuários do sistema              |
| Autenticação só por chave SSH | Não       | O Tailscale autentica via sua tailnet                                      |
| Reforço de IPv6        | Geralmente não  | Depende das configurações da sua VCN/sub-rede; verifique o que está realmente atribuído/exposto |

### Ainda recomendado

- **Permissões de credenciais:** `chmod 700 ~/.openclaw`
- **Auditoria de segurança:** `openclaw security audit`
- **Atualizações do sistema:** `sudo apt update && sudo apt upgrade` regularmente
- **Monitore o Tailscale:** Revise dispositivos no [console administrativo do Tailscale](https://login.tailscale.com/admin)

### Verifique a postura de segurança

```bash
# Confirm no public ports listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely
sudo systemctl disable --now ssh
```

---

## Alternativa: túnel SSH

Se o Tailscale Serve não estiver funcionando, use um túnel SSH:

```bash
# From your local machine (via Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Depois abra `http://localhost:18789`.

---

## Solução de problemas

### A criação da instância falha ("Out of capacity")

Instâncias ARM do nível gratuito são populares. Tente:

- Outro domínio de disponibilidade
- Tentar novamente fora do horário de pico (de manhã cedo)
- Usar o filtro "Always Free" ao selecionar o shape

### O Tailscale não conecta

```bash
# Check status
sudo tailscale status

# Re-authenticate
sudo tailscale up --ssh --hostname=openclaw --reset
```

### O Gateway não inicia

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### Não é possível acessar a UI de Controle

```bash
# Verify Tailscale Serve is running
tailscale serve status

# Check gateway is listening
curl http://localhost:18789

# Restart if needed
systemctl --user restart openclaw-gateway.service
```

### Problemas com binários ARM

Algumas ferramentas podem não ter builds ARM. Verifique:

```bash
uname -m  # Should show aarch64
```

A maioria dos pacotes npm funciona bem. Para binários, procure releases `linux-arm64` ou `aarch64`.

---

## Persistência

Todo o estado fica em:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` por agente, estado de canal/provedor e dados de sessão
- `~/.openclaw/workspace/` — workspace (SOUL.md, memória, artefatos)

Faça backup periodicamente:

```bash
openclaw backup create
```

---

## Relacionados

- [Acesso remoto ao Gateway](/pt-BR/gateway/remote) — outros padrões de acesso remoto
- [Integração com Tailscale](/pt-BR/gateway/tailscale) — documentação completa do Tailscale
- [Configuração do Gateway](/pt-BR/gateway/configuration) — todas as opções de configuração
- [Guia do DigitalOcean](/pt-BR/install/digitalocean) — se você quiser pago + cadastro mais fácil
- [Guia do Hetzner](/pt-BR/install/hetzner) — alternativa baseada em Docker
