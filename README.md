# Laboratório Cloud – Projeto 1
## Primeiro deploy de um site estático com Docker, Nginx e AWS EC2

**CETEP-I Itaparica · Material didático passo a passo para iniciantes absolutos**

Este material foi escrito para quem está tendo o primeiro contato com Docker, Linux e AWS. Leia cada explicação antes de executar o comando. Não pule etapas: cada fase prepara o ambiente para a próxima.

> **Objetivo da prática:** colocar um site estático (HTML, CSS, JavaScript e imagens) dentro de um container Docker e publicá-lo em uma máquina virtual Ubuntu na AWS (EC2), para que outras pessoas possam acessá-lo pela internet.

> **O que será utilizado:** computador com Windows, PowerShell, Docker Desktop (para o teste local), AWS EC2 com Ubuntu, SSH, SCP ou WinSCP, Docker e Nginx.
>
> **O que NÃO será utilizado neste primeiro deploy:** Amazon ECR, AWS CLI, Docker Compose, Kubernetes, Certbot ou banco de dados. Essas ferramentas podem ser estudadas em atividades futuras. Aqui vamos aprender o caminho mais simples: construir uma imagem e executá-la com `docker run`.

---

# 1. Antes de começar: o que vamos fazer?

Imagine que você criou um site no seu computador. Por enquanto, somente você consegue abrir esse site localmente. O objetivo é colocá-lo em um servidor na internet.

Vamos seguir este caminho:

1. Organizar os arquivos do site no computador.
2. Criar um arquivo chamado `Dockerfile`, que ensinará o Docker a montar o ambiente do site.
3. Construir uma **imagem Docker**.
4. Criar um **container** a partir dessa imagem e testar no próprio computador.
5. Criar uma máquina virtual Ubuntu na AWS, chamada EC2.
6. Acessar essa máquina remotamente usando SSH.
7. Instalar o Docker no Ubuntu.
8. Enviar o projeto do computador para a EC2.
9. Construir a imagem no servidor e iniciar o container.
10. Abrir o site pelo IP público da EC2.

## 1.1 Palavras que você precisa entender

| Palavra | Explicação simples |
|---|---|
| Site estático | Site formado por arquivos prontos, como HTML, CSS, JavaScript e imagens. Não precisa de um servidor de aplicação para gerar páginas dinamicamente. |
| HTML | Linguagem que define a estrutura e o conteúdo da página. |
| CSS | Linguagem que define a aparência: cores, fontes, tamanhos e posicionamento. |
| JavaScript | Linguagem que permite interações e comportamentos na página. |
| Servidor | Computador ou programa que fornece um serviço para outros computadores. |
| AWS | Plataforma de serviços de computação em nuvem. |
| EC2 | Serviço da AWS que oferece máquinas virtuais, como se alugássemos um computador na nuvem. |
| Ubuntu | Sistema operacional Linux que será instalado na máquina EC2. |
| Terminal | Programa no qual digitamos comandos para controlar o computador. |
| SSH | Protocolo que permite acessar com segurança o terminal de outra máquina pela rede. |
| Docker | Plataforma que permite criar e executar aplicações em containers. |
| Dockerfile | Arquivo de texto com instruções que ensinam o Docker a construir uma imagem. |
| Imagem | Pacote que contém o necessário para criar e iniciar um container. É como um molde ou modelo. |
| Container | Instância criada a partir de uma imagem. É o ambiente que está executando. |
| Nginx | Servidor web que recebe solicitações HTTP e entrega os arquivos do site ao navegador. |
| Porta | Número usado para identificar um serviço de rede. Nesta prática, usaremos 8081 no servidor e 80 dentro do container. |
| Security Group | Firewall virtual da AWS que controla quais conexões podem chegar à EC2. |

## 1.2 Diferença entre Dockerfile, imagem e container

Pense em uma receita de bolo:

- **Dockerfile:** é a receita. Contém as instruções.
- **Imagem:** é o bolo preparado conforme a receita, pronto para ser utilizado como modelo.
- **Container:** é uma execução desse modelo. Podemos criar vários containers a partir da mesma imagem.

O Dockerfile não é o container e também não é a imagem. Ele é o arquivo usado para construir a imagem.

## 1.3 Como ficará a arquitetura

```text
COMPUTADOR DO ALUNO
  HTML, CSS, JavaScript e imagens
             |
             | SCP ou WinSCP: envia os arquivos
             v
AWS EC2 – UBUNTU
  Docker instalado
       |
       | executa a imagem
       v
CONTAINER
  Nginx escutando na porta 80
       |
       | encaminhamento de portas: 8081 -> 80
       v
NAVEGADOR DO VISITANTE
  http://IP_PUBLICO_DA_EC2:8081
```

**Em palavras simples:** o visitante acessa a porta 8081 do endereço público da EC2. O Docker encaminha essa conexão para a porta 80 do container. O Nginx recebe a solicitação e entrega o arquivo `index.html` e os demais arquivos do site.

---

# 2. Preparar o computador

## 2.1 O que você precisa ter

- Windows 10 ou 11.
- Pasta do projeto do site.
- Conta AWS autorizada a criar uma instância EC2.
- Docker Desktop instalado e funcionando no computador, para construir e testar a imagem localmente.
- PowerShell ou Windows Terminal.
- Chave privada SSH no formato `.pem`, criada ao configurar a EC2.
- WinSCP, caso prefira transferir arquivos por uma interface gráfica.

**Atenção aos custos:** recursos da AWS podem gerar cobrança. Utilize a conta e o tipo de instância indicados pelo professor. Não crie várias instâncias sem autorização.

## 2.2 Conferir se o Docker está instalado

Abra o PowerShell no Windows.

Execute:

```powershell
docker --version
```

**O que significa cada parte?**

- `docker`: chama o programa Docker.
- `--version`: pede que o programa mostre sua versão.
- `--`: os dois traços indicam uma opção ou parâmetro do comando.

Se aparecer algo como `Docker version ...`, o comando Docker está instalado.

Agora execute:

```powershell
docker info
```

Esse comando mostra informações do ambiente Docker, como imagens, containers e configurações. Ele também verifica se o terminal consegue conversar com o Docker Engine.

Se aparecer uma mensagem como `Cannot connect to the Docker daemon`, abra o Docker Desktop e espere ele terminar de iniciar. Depois tente novamente.

---

# 3. Conhecer e conferir os arquivos do site

A pasta do projeto deve ter esta organização:

```text
projeto-laboratorio/
├── Dockerfile
└── website/
    ├── index.html
    ├── assets/
    │   └── logo-cetep-i.jpg
    ├── css/
    │   └── style.css
    └── js/
        └── script.js
```

Observe:

- `projeto-laboratorio/` é a pasta principal do projeto.
- `Dockerfile` fica diretamente dentro da pasta principal.
- `website/` guarda os arquivos que formam o site.
- `index.html` é a página inicial.
- `assets/` guarda imagens e outros recursos.
- `css/` guarda o arquivo de estilos.
- `js/` guarda o JavaScript.

O nome dos arquivos e das pastas precisa corresponder ao que está escrito no HTML. Em Linux, letras maiúsculas e minúsculas são diferentes: `Logo.jpg` não é o mesmo arquivo que `logo.jpg`.

## 3.1 Abrir a pasta do projeto no PowerShell

Exemplo:

```powershell
cd "C:\Users\Aluno\Downloads\projeto-laboratorio"
```

**Explicação:**

- `cd` vem de *change directory*, que significa “mudar de diretório” ou “entrar em uma pasta”.
- O caminho entre aspas indica qual pasta queremos abrir.
- As aspas são importantes quando o caminho tem espaços.

O caminho acima é apenas um exemplo. Troque pelo caminho real do seu computador.

Para conferir em qual pasta você está, execute:

```powershell
pwd
```

`pwd` significa *print working directory*. Ele mostra o caminho da pasta atual.

Para listar os arquivos e pastas:

```powershell
dir
```

No PowerShell, `dir` mostra o conteúdo da pasta atual.

Você deve encontrar `Dockerfile` e `website` depois de criar o Dockerfile na próxima fase.

---

# 4. Criar o Dockerfile: a receita da imagem

## 4.1 O que é Dockerfile?

O `Dockerfile` é um arquivo de texto que contém instruções para o Docker construir uma imagem.

Ele responde a perguntas como:

- Qual imagem pronta será utilizada como ponto de partida?
- Quais arquivos do projeto devem ser copiados?
- Qual porta o serviço utiliza?
- Qual programa deve iniciar quando o container for executado?

O nome do arquivo deve ser exatamente `Dockerfile`, com D maiúsculo e **sem extensão**. Não deve ser `Dockerfile.txt`.

## 4.2 Criar o arquivo no Windows

Na pasta principal do projeto, execute:

```powershell
notepad Dockerfile
```

Explicação:

- `notepad`: abre o Bloco de Notas do Windows.
- `Dockerfile`: nome do arquivo que queremos abrir.
- Se o arquivo ainda não existir, o Bloco de Notas perguntará se você deseja criá-lo.

Cole o conteúdo abaixo:

```dockerfile
# Imagem base: Nginx com Alpine Linux
FROM nginx:alpine

# Copia os arquivos do site para a pasta pública do Nginx
COPY website/ /usr/share/nginx/html/

# Documenta que o Nginx utiliza a porta 80 dentro do container
EXPOSE 80

# Inicia o Nginx em primeiro plano
CMD ["nginx", "-g", "daemon off;"]
```

Salve o arquivo e feche o Bloco de Notas.

## 4.3 Explicação de CADA instrução do Dockerfile

### Linha 1 – Comentário

```dockerfile
# Imagem base: Nginx com Alpine Linux
```

- `#` inicia um comentário no Dockerfile.
- Comentário é uma anotação para pessoas que estão lendo o arquivo.
- O Docker não executa o texto que vem depois de `#` nessa linha.
- Comentários ajudam a explicar o objetivo das instruções.

### Linha 2 – FROM

```dockerfile
FROM nginx:alpine
```

`FROM` define a imagem que será usada como ponto de partida para construir a nossa imagem.

Imagine que vamos construir uma casa: antes de colocar os móveis, precisamos de uma estrutura inicial. O `FROM` escolhe essa estrutura.

Agora vamos separar cada parte:

- `FROM`: instrução do Dockerfile que escolhe a imagem base.
- `nginx`: nome da imagem. Ela já contém o servidor web Nginx.
- `:`: separa o nome da imagem da sua tag.
- `alpine`: tag da imagem. Identifica a variante baseada no Alpine Linux, uma distribuição Linux conhecida por ser pequena e leve.

**O que é tag?** Tag é uma identificação associada a uma imagem. Ela ajuda a indicar uma versão ou variante. Neste caso, `alpine` identifica a variante da imagem Nginx que queremos utilizar.

**Por que usar Nginx?** Porque o nosso projeto é um site estático. O Nginx consegue receber solicitações do navegador e entregar arquivos como HTML, CSS, JavaScript e imagens.

### Linha 3 – Linha em branco

A linha vazia apenas separa visualmente as instruções. Ela não executa nenhuma ação e não altera a imagem.

### Linha 4 – COPY

```dockerfile
COPY website/ /usr/share/nginx/html/
```

`COPY` copia arquivos ou pastas do computador onde a imagem está sendo construída para dentro da imagem Docker.

Vamos separar:

- `COPY`: instrução que realiza a cópia.
- `website/`: origem, ou seja, a pasta do nosso projeto que será copiada.
- `/usr/share/nginx/html/`: destino dentro da imagem. É a pasta padrão em que a imagem oficial do Nginx procura os arquivos do site.

**O que significa a barra `/`?**

No início de um caminho Linux, `/` representa a raiz do sistema de arquivos. Portanto, `/usr/share/nginx/html/` é um caminho absoluto dentro do container.

**Por que existe um espaço entre os dois caminhos?**

Porque o comando precisa saber duas coisas: primeiro, de onde copiar; segundo, para onde copiar.

**O que acontece na prática?**

Os arquivos que estão em `website/` no projeto são colocados dentro de `/usr/share/nginx/html/` na imagem. Assim, quando o container iniciar, o Nginx encontrará o `index.html` e poderá entregar o site.

### Linha 5 – Linha em branco

Serve apenas para organizar e facilitar a leitura.

### Linha 6 – EXPOSE

```dockerfile
EXPOSE 80
```

`EXPOSE` documenta qual porta o serviço dentro do container utiliza.

Separando:

- `EXPOSE`: instrução do Dockerfile que registra a porta utilizada pela aplicação.
- `80`: número da porta. O Nginx utiliza normalmente a porta 80 para receber conexões HTTP.

**Atenção: EXPOSE NÃO PUBLICA A PORTA NA INTERNET!**

Essa é uma diferença muito importante.

`EXPOSE 80` informa que o serviço utiliza a porta 80 dentro do container. Para permitir que o computador ou a internet acesse essa porta, usaremos `-p` no comando `docker run`.

### Linha 7 – Linha em branco

Apenas organização visual.

### Linha 8 – CMD

```dockerfile
CMD ["nginx", "-g", "daemon off;"]
```

Esta instrução define o comando padrão que será executado quando um container for iniciado a partir da imagem, desde que esse comando não seja substituído na inicialização.

Vamos entender cada elemento:

- `CMD`: instrução do Dockerfile que define o comando padrão do container.
- `[` e `]`: indicam que estamos usando uma lista de elementos no formato JSON, também chamada de *exec form*.
- `"nginx"`: é o programa que queremos executar. Nesse caso, o servidor web Nginx.
- `,`: separa um elemento do próximo dentro da lista.
- `"-g"`: é uma opção do programa Nginx. Ela permite fornecer uma diretiva de configuração pela linha de comando.
- `"daemon off;"`: é o valor passado para a opção `-g`.
- `;`: encerra a diretiva de configuração do Nginx.
- `"`: delimita cada texto da lista.

**O que significa `daemon off;`?**

Normalmente, um servidor pode iniciar em segundo plano, como um serviço independente. Porém, o Docker precisa acompanhar um processo principal em execução dentro do container.

A expressão `daemon off;` diz ao Nginx para não se colocar em segundo plano. Ele permanece em primeiro plano.

**Por que isso é importante?**

O Docker considera o processo principal como referência para saber se o container continua em execução. Se o processo principal termina, o container também encerra.

Por isso, usamos:

```dockerfile
CMD ["nginx", "-g", "daemon off;"]
```

Assim, o Nginx permanece em primeiro plano e o container continua ativo enquanto o servidor estiver funcionando.

**Por que usamos colchetes e aspas?**

Essa é a forma exec do `CMD`. Cada item é um argumento separado:

1. O programa: `nginx`.
2. A opção: `-g`.
3. O valor da opção: `daemon off;`.

O Docker executa o programa diretamente, sem precisar iniciar um shell para interpretar a linha.

### Resumo do Dockerfile

| Instrução | O que faz? | Neste projeto |
|---|---|---|
| `FROM` | Escolhe a imagem base | Usa Nginx com Alpine |
| `COPY` | Copia arquivos para a imagem | Copia o site para a pasta pública do Nginx |
| `EXPOSE` | Documenta a porta utilizada | Informa a porta 80 |
| `CMD` | Define o comando padrão de inicialização | Inicia o Nginx em primeiro plano |
| `#` | Adiciona comentário | Explica o arquivo para quem está lendo |

## 4.4 Conferir se o Dockerfile foi criado corretamente

Execute:

```powershell
dir
```

O resultado deve mostrar:

```text
Dockerfile
website
```

Se aparecer `Dockerfile.txt`, o arquivo foi salvo com extensão errada. Renomeie para `Dockerfile`.

---

# 5. Construir a imagem Docker

Agora que temos o Dockerfile, vamos pedir ao Docker para construir a imagem.

Na pasta principal do projeto, execute:

```powershell
docker build -t laboratorio-cetepi:v1 .
```

## 5.1 Explicação de cada parte do comando

- `docker`: chama o programa Docker.
- `build`: significa construir. Aqui, vamos construir uma imagem.
- `-t`: abreviação de *tag*. Permite atribuir um nome e uma identificação à imagem.
- `laboratorio-cetepi`: nome escolhido para a imagem.
- `:`: separa o nome da imagem da tag.
- `v1`: tag escolhida para identificar a versão 1.
- `.`: ponto que representa o diretório atual. É o contexto de construção, ou seja, a pasta que o Docker poderá utilizar para encontrar o Dockerfile e os arquivos necessários.

**Por que o ponto é importante?** Porque o Docker precisa saber em qual pasta procurar o Dockerfile e os arquivos usados pelo `COPY`. Se você executar o comando em outra pasta, poderá receber um erro ou construir a imagem com arquivos diferentes dos esperados.

## 5.2 O que acontece durante a construção?

O Docker lê o Dockerfile de cima para baixo e executa suas instruções para montar a imagem:

1. Obtém a imagem base `nginx:alpine`, se ainda não estiver disponível localmente.
2. Copia a pasta `website/` para o diretório público do Nginx.
3. Registra a informação da porta 80.
4. Guarda o comando padrão que será usado quando o container iniciar.

Ao terminar, o Docker informa que a imagem foi construída.

## 5.3 Conferir se a imagem existe

Execute:

```powershell
docker images
```

- `docker`: programa Docker.
- `images`: lista as imagens disponíveis no computador.

Procure uma linha semelhante a:

```text
REPOSITORY           TAG
laboratorio-cetepi   v1
```

Se aparecer, a imagem foi criada.

---

# 6. Testar a imagem no computador

Antes de enviar o projeto para a nuvem, vamos testar se o site funciona no próprio computador.

## 6.1 Criar e iniciar o container

Execute:

```powershell
docker run -d --name laboratorio-cetepi-teste -p 8080:80 laboratorio-cetepi:v1
```

Entenda cada parte:

- `docker`: chama o Docker.
- `run`: cria e inicia um novo container a partir de uma imagem.
- `-d`: significa *detached*. Executa o container em segundo plano, liberando o terminal para outros comandos.
- `--name`: opção que permite escolher um nome para o container.
- `laboratorio-cetepi-teste`: nome que escolhemos para esse container de teste.
- `-p`: significa publicar ou mapear uma porta.
- `8080:80`: mapeamento de portas. O número antes dos dois-pontos é a porta do computador; o número depois é a porta dentro do container.
- `laboratorio-cetepi:v1`: nome e tag da imagem que será utilizada.

**Entenda `8080:80`:**

- `8080`: porta do computador (máquina host).
- `:`: separa a porta externa da porta interna.
- `80`: porta do container, onde o Nginx está escutando.

Portanto, quando acessarmos `http://localhost:8080`, o Docker encaminhará a conexão para a porta 80 do container.

## 6.2 Verificar se o container está em execução

```powershell
docker ps
```

- `ps` é uma abreviação tradicional de *process status*.
- No Docker, `docker ps` lista os containers em execução.

Procure `laboratorio-cetepi-teste` e confira se o status começa com `Up`.

Para listar também os containers parados:

```powershell
docker ps -a
```

A opção `-a` significa *all* (todos).

## 6.3 Abrir o site

No navegador, acesse:

```text
http://localhost:8080
```

- `http://` indica o protocolo HTTP.
- `localhost` significa o próprio computador.
- `:8080` indica a porta publicada no computador.

Se o site aparecer, o teste local funcionou.

## 6.4 Consultar os logs

```powershell
docker logs laboratorio-cetepi-teste
```

- `logs`: mostra as mensagens registradas pelo container.
- `laboratorio-cetepi-teste`: identifica de qual container queremos ver os logs.

Para acompanhar as mensagens continuamente:

```powershell
docker logs -f laboratorio-cetepi-teste
```

- `-f` significa *follow* (acompanhar).
- Para parar de acompanhar os logs, pressione `Ctrl + C`. Isso encerra a visualização, não significa que o container será parado.

## 6.5 Parar e remover o container de teste

Primeiro:

```powershell
docker stop laboratorio-cetepi-teste
```

- `stop`: solicita que o container seja parado.
- `laboratorio-cetepi-teste`: nome do container.

Depois:

```powershell
docker rm laboratorio-cetepi-teste
```

- `rm`: abreviação de *remove* (remover).
- Remove o container que já foi parado.

**Atenção:** remover um container não é o mesmo que remover uma imagem. A imagem `laboratorio-cetepi:v1` continua disponível.

---

# 7. Criar a máquina virtual na AWS (EC2)

> Se o professor já disponibilizou uma EC2 para a turma, não crie outra. Siga a orientação do professor. Criar recursos adicionais pode gerar custos.

## 7.1 Entrar no console AWS

1. Acesse https://console.aws.amazon.com/.
2. Entre na sua conta.
3. Na busca dos serviços, digite `EC2`.
4. Clique no serviço EC2.
5. Confira se está na região indicada pelo professor.

## 7.2 Criar a instância

1. Clique em **Launch instance**.
2. Em **Name**, escreva `laboratorio-cetepi`.
3. Em **Application and OS Images (AMI)**, selecione **Ubuntu Server LTS**, conforme orientação do professor.
4. Escolha o tipo de instância indicado pelo professor e confira os possíveis custos.
5. Em **Key pair**, crie ou selecione um par de chaves.
6. Se criar um novo par, escolha `.pem` para utilizar com OpenSSH no Windows.
7. Baixe a chave privada e guarde-a em local seguro.

**O que é AMI?** AMI significa *Amazon Machine Image*. É um modelo utilizado para iniciar uma instância EC2. Nesse laboratório, a AMI contém o sistema operacional Ubuntu.

**O que é Key Pair?** É um par de chaves utilizado para autenticar o acesso SSH. A chave privada `.pem` fica com você. Não envie essa chave a outras pessoas.

## 7.3 Configurar o Security Group

O Security Group é como um firewall virtual da EC2. Ele controla quais conexões podem chegar ao servidor.

Crie as regras de entrada:

| Tipo | Protocolo | Porta | Origem | Para que serve |
|---|---|---:|---|---|
| SSH | TCP | 22 | Meu IP | Permite administrar a EC2 pelo terminal |
| Custom TCP | TCP | 8081 | 0.0.0.0/0 | Permite que visitantes acessem o site |

Explicando os campos:

- **Tipo:** categoria da regra, por exemplo SSH.
- **Protocolo:** forma de comunicação. Nesta prática usamos TCP.
- **Porta:** número do serviço que será acessado.
- **Origem:** de onde a conexão pode partir.
- **Meu IP:** limita o SSH ao endereço de internet que você está utilizando no momento.
- **0.0.0.0/0:** significa qualquer endereço IPv4. É usado aqui para permitir que visitantes acessem o site.

**Atenção:** não deixe SSH aberto para toda a internet sem necessidade. A porta 8081 ficará pública para permitir a visita ao site.

## 7.4 Lançar a instância

1. Revise as configurações.
2. Clique em **Launch instance**.
3. Aguarde o estado ficar como `Running`.
4. Aguarde também as verificações de status da instância.

## 7.5 Copiar o IP público

Selecione a instância e localize **Public IPv4 address**.

Exemplo fictício:

```text
54.123.45.67
```

O endereço real será diferente. Não copie o endereço do exemplo: use o IP da sua própria instância.

---

# 8. Conectar ao Ubuntu usando SSH

## 8.1 O que é SSH?

SSH significa *Secure Shell*. É uma forma segura de acessar o terminal de outro computador pela rede.

Neste laboratório, o computador local é o Windows e o computador remoto é a EC2 com Ubuntu.

## 8.2 Localizar a chave `.pem`

Encontre o arquivo que foi baixado quando o par de chaves foi criado.

Exemplo:

```text
C:\Users\Aluno\Downloads\laboratorio-cetepi.pem
```

Não compartilhe esse arquivo. Ele é uma credencial privada.

## 8.3 Conectar pelo PowerShell

No PowerShell do Windows, execute:

```powershell
ssh -i "C:\caminho\da\chave.pem" ubuntu@IP_PUBLICO_DA_EC2
```

Explicação:

- `ssh`: inicia uma conexão SSH.
- `-i`: informa qual arquivo de identidade (chave privada) será utilizado.
- `"C:\caminho\da\chave.pem"`: caminho completo da chave privada.
- `ubuntu`: nome do usuário Linux da imagem Ubuntu da AWS.
- `@`: separa o usuário do endereço do servidor.
- `IP_PUBLICO_DA_EC2`: endereço público da sua instância.

Exemplo fictício:

```powershell
ssh -i "C:\Users\Aluno\Downloads\laboratorio-cetepi.pem" ubuntu@54.123.45.67
```

Na primeira conexão, o SSH pode perguntar se você confia na identidade do servidor. Confira o IP e digite `yes` para continuar.

**Por que usamos `ubuntu` e não `ec2-user`?** Porque a imagem escolhida é Ubuntu. O usuário padrão das imagens Ubuntu da AWS é `ubuntu`. O usuário `ec2-user` é utilizado em distribuições como Amazon Linux.

## 8.4 Como saber que entrou no servidor?

O terminal mostrará algo parecido com:

```text
ubuntu@ip-172-31-xx-xx:~$
```

Isso significa que você está no terminal do Ubuntu na EC2. Os comandos seguintes desta fase serão executados no servidor remoto, não no Windows.

Para sair do servidor:

```bash
exit
```

- `exit`: encerra a sessão do terminal remoto e retorna ao terminal local.

---

# 9. Instalar Docker no Ubuntu

Todos os comandos desta seção devem ser digitados no terminal SSH da EC2.

## 9.1 Atualizar a lista de pacotes

```bash
sudo apt update
```

Explicação:

- `sudo`: executa o comando com privilégios administrativos.
- `apt`: gerenciador de pacotes do Ubuntu. É utilizado para instalar e administrar programas.
- `update`: atualiza a lista de pacotes disponíveis nos repositórios configurados.

**Importante:** `apt update` atualiza a lista de informações dos pacotes. Não significa, por si só, que todos os programas foram atualizados.

## 9.2 Instalar o Docker

```bash
sudo apt install -y docker.io
```

Explicação:

- `sudo`: executa com privilégios administrativos.
- `apt`: gerenciador de pacotes.
- `install`: indica que queremos instalar um programa.
- `-y`: responde automaticamente “sim” às perguntas de confirmação.
- `docker.io`: nome do pacote Docker disponível nos repositórios do Ubuntu.

Aguarde a instalação terminar.

## 9.3 Iniciar o serviço e habilitá-lo no boot

```bash
sudo systemctl enable --now docker
```

Explicação:

- `sudo`: executa com permissão administrativa.
- `systemctl`: ferramenta utilizada para controlar serviços do Linux.
- `enable`: configura o serviço para iniciar automaticamente quando o sistema ligar.
- `--now`: além de habilitar para o próximo início, inicia o serviço imediatamente.
- `docker`: nome do serviço que será iniciado.

## 9.4 Conferir a versão

```bash
sudo docker --version
```

- `docker`: chama o Docker.
- `--version`: mostra a versão instalada.

## 9.5 Conferir se o serviço está ativo

```bash
sudo systemctl status docker --no-pager
```

Explicação:

- `status`: consulta o estado do serviço.
- `docker`: serviço que queremos verificar.
- `--no-pager`: mostra o resultado diretamente no terminal, sem abrir um visualizador de texto.

Procure `active (running)`. Isso indica que o serviço Docker está ativo.

## 9.6 Por que usamos sudo?

O Linux protege operações administrativas. Instalar programas e controlar serviços exige permissões elevadas. O `sudo` executa o comando com essas permissões, desde que o usuário esteja autorizado.

## 9.7 Opcional: executar Docker sem digitar sudo

Em laboratório, pode ser conveniente adicionar o usuário `ubuntu` ao grupo `docker`:

```bash
sudo usermod -aG docker ubuntu
```

Explicação:

- `usermod`: altera configurações de uma conta de usuário.
- `-a`: significa *append*, ou seja, acrescentar o usuário a um grupo sem remover suas outras associações.
- `-G`: informa os grupos aos quais o usuário será associado.
- `docker`: nome do grupo.
- `ubuntu`: usuário que será adicionado.

Depois, encerre a sessão SSH:

```bash
exit
```

Conecte-se novamente e teste:

```bash
docker ps
```

**Aviso de segurança:** fazer parte do grupo `docker` concede privilégios muito elevados, que podem permitir ações equivalentes às de administrador. Em servidores compartilhados ou de produção, siga a política de segurança definida pelo responsável. Se não tiver certeza, continue utilizando `sudo docker`.

---

# 10. Enviar os arquivos do Windows para a EC2

O site está no computador, mas o servidor EC2 ainda precisa receber os arquivos. Vamos transferir o `Dockerfile` e a pasta `website`.

Você pode escolher uma das opções:

- **Opção A:** PowerShell com SCP.
- **Opção B:** WinSCP, com interface gráfica.

Não precisa utilizar as duas.

## 10.1 Opção A – Transferir pelo SCP

SCP significa *Secure Copy*. É um comando que copia arquivos entre computadores utilizando SSH.

### Passo A – Abrir a pasta do projeto no PowerShell

No Windows, entre na pasta principal do projeto:

```powershell
cd "C:\caminho\para\projeto-laboratorio"
```

A pasta atual deve conter `Dockerfile` e `website`.

### Passo B – Criar uma pasta no servidor

Execute no PowerShell do Windows:

```powershell
ssh -i "C:\caminho\da\chave.pem" ubuntu@IP_PUBLICO_DA_EC2 "mkdir -p ~/laboratorio-cetepi"
```

Explicação:

- `ssh`: conecta ao servidor.
- `-i`: informa o arquivo da chave privada.
- `ubuntu@IP_PUBLICO_DA_EC2`: usuário e endereço do servidor.
- `"mkdir -p ~/laboratorio-cetepi"`: comando que será executado no Ubuntu remoto.
- `mkdir`: cria uma pasta.
- `-p`: cria a pasta sem apresentar erro caso ela já exista e também cria diretórios intermediários quando necessário.
- `~`: representa a pasta pessoal do usuário conectado. Para `ubuntu`, normalmente é `/home/ubuntu`.
- `laboratorio-cetepi`: nome da pasta que receberá os arquivos.

### Passo C – Copiar o Dockerfile e a pasta website

Ainda no PowerShell do Windows, execute:

```powershell
scp -i "C:\caminho\da\chave.pem" -r Dockerfile website ubuntu@IP_PUBLICO_DA_EC2:~/laboratorio-cetepi/
```

Explicação de cada parte:

- `scp`: inicia a cópia segura de arquivos.
- `-i`: indica a chave privada utilizada para autenticar.
- `"C:\caminho\da\chave.pem"`: caminho da chave privada.
- `-r`: significa *recursive*. Permite copiar pastas e todo o seu conteúdo.
- `Dockerfile`: primeiro item que será enviado.
- `website`: pasta inteira que será enviada.
- `ubuntu@IP_PUBLICO_DA_EC2`: usuário e endereço do destino.
- `:`: separa o endereço remoto do caminho de destino.
- `~/laboratorio-cetepi/`: pasta de destino no servidor.

**Atenção:** os comandos são executados no PowerShell do Windows. Não digite esses caminhos do Windows dentro do terminal Ubuntu.

## 10.2 Opção B – Transferir usando WinSCP

1. Abra o WinSCP.
2. Escolha o protocolo **SFTP**.
3. Em **Host name**, informe o IP público da EC2.
4. Em **Port number**, informe `22`.
5. Em **User name**, digite `ubuntu`.
6. Configure a autenticação com a chave privada `.pem`. Dependendo da versão, o WinSCP pode solicitar a conversão para `.ppk`.
7. Conecte-se.
8. No painel do computador, localize `Dockerfile` e a pasta `website`.
9. No painel remoto, abra `/home/ubuntu/laboratorio-cetepi`.
10. Arraste `Dockerfile` e `website` para a pasta remota.

## 10.3 Conferir se os arquivos chegaram

Volte ao terminal SSH da EC2 e execute:

```bash
cd ~/laboratorio-cetepi
```

- `cd`: entra em uma pasta.
- `~`: pasta pessoal do usuário `ubuntu`.
- `/laboratorio-cetepi`: pasta criada para receber o projeto.

Agora execute:

```bash
ls -la
```

Explicação:

- `ls`: lista arquivos e pastas.
- `-l`: mostra detalhes, como permissões, proprietário, tamanho e data.
- `-a`: inclui também arquivos ocultos.

Você deve encontrar:

```text
Dockerfile
website
```

Confira o conteúdo da pasta:

```bash
ls -la website
```

Se os arquivos não estiverem no local correto, corrija a transferência antes de continuar.

---

# 11. Construir a imagem na EC2

Agora estamos no Ubuntu da AWS, dentro da pasta do projeto.

Confirme a localização:

```bash
pwd
```

O resultado deve ser parecido com:

```text
/home/ubuntu/laboratorio-cetepi
```

Construa a imagem:

```bash
sudo docker build -t laboratorio-cetepi:v1 .
```

Explicação:

- `sudo`: executa com privilégios administrativos.
- `docker`: chama o Docker.
- `build`: constrói uma imagem.
- `-t`: define o nome e a tag da imagem.
- `laboratorio-cetepi`: nome da imagem.
- `:v1`: tag que identifica a versão 1.
- `.`: usa a pasta atual como contexto de construção.

Aguarde a conclusão. Depois confira:

```bash
sudo docker images
```

Procure a imagem `laboratorio-cetepi` com a tag `v1`.

---

# 12. Executar o container na EC2

## 12.1 Iniciar o container

Execute:

```bash
sudo docker run -d --name laboratorio-cetepi --restart unless-stopped -p 8081:80 laboratorio-cetepi:v1
```

Agora vamos entender cada parte, sem pular nenhuma:

- `sudo`: executa com privilégios administrativos.
- `docker`: chama o Docker.
- `run`: cria e inicia um container a partir de uma imagem.
- `-d`: executa em segundo plano (*detached*). O terminal fica livre.
- `--name`: permite escolher o nome do container.
- `laboratorio-cetepi`: nome que será atribuído ao container.
- `--restart`: define a política de reinicialização do container.
- `unless-stopped`: política que permite reiniciar o container automaticamente quando o Docker ou o servidor reiniciar, exceto se ele tiver sido parado manualmente.
- `-p`: publica/mapeia uma porta do servidor para uma porta do container.
- `8081:80`: porta 8081 da EC2 encaminhada para a porta 80 do container.
- `laboratorio-cetepi:v1`: imagem e tag que serão utilizadas para criar o container.

### 12.2 Entender o mapeamento de portas 8081:80

```text
-p 8081:80
   |    |
   |    +---- Porta 80 dentro do container (Nginx)
   |
   +--------- Porta 8081 da EC2 (servidor)
```

Quando o visitante digita:

```text
http://IP_PUBLICO_DA_EC2:8081
```

a conexão chega à porta 8081 da EC2. O Docker encaminha a conexão para a porta 80 do container. O Nginx recebe a solicitação e entrega o site.

**Atenção:** para isso funcionar, a porta TCP 8081 também precisa estar liberada no Security Group da EC2.

## 12.3 Conferir o container

```bash
sudo docker ps
```

Esse comando lista os containers em execução.

Procure:

- nome: `laboratorio-cetepi`;
- status: `Up`;
- portas: algo semelhante a `0.0.0.0:8081->80/tcp`.

O trecho `0.0.0.0:8081->80/tcp` indica que a porta 8081 está publicada nas interfaces IPv4 do servidor e encaminhada à porta 80 do container.

Para listar também containers parados:

```bash
sudo docker ps -a
```

O `-a` significa *all* (todos).

## 12.4 Consultar os logs

```bash
sudo docker logs laboratorio-cetepi
```

- `logs`: mostra as mensagens registradas pelo container.
- `laboratorio-cetepi`: nome do container que queremos consultar.

Para acompanhar continuamente:

```bash
sudo docker logs -f laboratorio-cetepi
```

- `-f`: acompanha as novas mensagens.
- `Ctrl + C`: encerra o acompanhamento dos logs. Não é o mesmo que parar o container.

---

# 13. Abrir o site pela internet

No navegador do computador, digite:

```text
http://IP_PUBLICO_DA_EC2:8081
```

Exemplo fictício:

```text
http://54.123.45.67:8081
```

Substitua pelo IP público da sua EC2.

Se a página do CETEP-I aparecer, o deploy foi realizado.

## 13.1 O que conferir no site?

- A logomarca aparece?
- O menu funciona?
- A seção **O laboratório** abre?
- A seção **Tecnologias** apresenta as ferramentas?
- A seção **Status** abre?
- As imagens carregam?
- O CSS está aplicado?
- Os botões e interações funcionam?

## 13.2 Testar a resposta do servidor pelo próprio Ubuntu

Na EC2, execute:

```bash
curl -I http://localhost:8081
```

Explicação:

- `curl`: ferramenta de linha de comando para realizar solicitações a endereços de rede.
- `-I`: solicita apenas os cabeçalhos da resposta HTTP.
- `http://`: protocolo utilizado.
- `localhost`: a própria máquina EC2.
- `:8081`: porta publicada no servidor.

Se o serviço responder com um código HTTP como `200 OK`, é um sinal de que o Nginx está entregando a resposta. Outros códigos podem indicar redirecionamento ou algum problema que precisa ser investigado.

## 13.3 Sobre o painel Status do site

O painel Status da página é demonstrativo e estático. Ele apresenta informações explicativas sobre a arquitetura do laboratório, mas não consulta automaticamente o estado real da EC2, do Docker ou do Nginx.

Para consultar o estado real do ambiente, utilize os comandos no terminal da EC2:

```bash
sudo docker ps
```

Lista containers em execução.

```bash
sudo systemctl status docker --no-pager
```

Consulta se o serviço Docker está ativo.

```bash
curl -I http://localhost:8081
```

Testa a resposta HTTP do site pela própria EC2.

---

# 14. Como atualizar o site depois de fazer alterações

Se você alterar o HTML, CSS, JavaScript ou as imagens no computador, o container que já está executando não recebe essas mudanças automaticamente.

Para publicar uma nova versão, será necessário:

1. Enviar os arquivos atualizados para a EC2.
2. Construir uma nova imagem.
3. Parar e remover o container antigo.
4. Criar um novo container usando a nova imagem.

## 14.1 Enviar os arquivos atualizados

Utilize novamente SCP ou WinSCP, conforme explicado na Fase 10. Envie o `Dockerfile` e a pasta `website` para:

```text
/home/ubuntu/laboratorio-cetepi
```

## 14.2 Construir uma nova imagem com outra tag

Na EC2:

```bash
cd ~/laboratorio-cetepi
```

Depois:

```bash
sudo docker build -t laboratorio-cetepi:v2 .
```

Agora usamos `v2` para identificar a segunda versão.

A imagem antiga `v1` continua existindo. A nova imagem terá a tag `v2`.

## 14.3 Parar o container antigo

```bash
sudo docker stop laboratorio-cetepi
```

`stop` solicita que o container seja parado.

## 14.4 Remover o container antigo

```bash
sudo docker rm laboratorio-cetepi
```

`rm` remove o container que foi parado.

**Importante:** esses comandos não apagam a pasta do projeto e não removem automaticamente as imagens `v1` ou `v2`.

## 14.5 Criar o container com a nova imagem

```bash
sudo docker run -d --name laboratorio-cetepi --restart unless-stopped -p 8081:80 laboratorio-cetepi:v2
```

Agora o container será criado usando a imagem `v2`.

Confira:

```bash
sudo docker ps
```

Atualize o navegador com `Ctrl + F5` para solicitar os arquivos novamente, evitando que o navegador mostre uma cópia antiga armazenada em cache.

---

# 15. Solução de problemas

## Problema 1 – `docker` não foi encontrado

Possível causa: Docker não foi instalado corretamente.

Verifique:

```bash
sudo systemctl status docker --no-pager
```

Se necessário, inicie:

```bash
sudo systemctl enable --now docker
```

## Problema 2 – `Cannot connect to the Docker daemon`

O cliente Docker não está conseguindo conversar com o serviço Docker.

Verifique:

```bash
sudo systemctl status docker --no-pager
```

Se estiver parado:

```bash
sudo systemctl start docker
```

## Problema 3 – `Permission denied`

Tente executar o comando com `sudo`:

```bash
sudo docker ps
```

Se quiser executar sem `sudo`, siga as orientações da seção 9.7 e abra uma nova sessão SSH.

## Problema 4 – O navegador não abre o site

Verifique:

1. A EC2 está ligada?
2. O IP público está correto?
3. Você colocou `:8081` no endereço?
4. O Security Group permite entrada TCP na porta 8081?
5. O container está em execução?

Confira:

```bash
sudo docker ps
```

Se não aparecer, verifique também os containers parados:

```bash
sudo docker ps -a
```

## Problema 5 – A porta 8081 já está em uso

Pode existir outro container ou serviço utilizando a porta.

Confira:

```bash
sudo docker ps
```

Não remova containers desconhecidos. Se a EC2 for compartilhada, peça orientação ao professor.

## Problema 6 – O container encerra logo após iniciar

Consulte:

```bash
sudo docker logs laboratorio-cetepi
```

Confira também se o Dockerfile está correto e se a pasta `website` contém o arquivo `index.html`.

## Problema 7 – A página abre sem CSS, JavaScript ou imagens

Confira os arquivos enviados:

```bash
ls -R ~/laboratorio-cetepi/website
```

`ls` lista arquivos e `-R` percorre as subpastas recursivamente.

Lembre-se: Linux diferencia letras maiúsculas e minúsculas. `Style.css` e `style.css` são nomes diferentes.

## Problema 8 – SSH não conecta

Verifique:

- IP público correto;
- instância EC2 ligada;
- regra TCP 22 no Security Group;
- origem SSH configurada para seu IP;
- usuário `ubuntu`;
- caminho correto da chave `.pem`.

Não compartilhe sua chave privada.

---

# 16. Segurança e cuidados importantes

- Nunca compartilhe a chave privada `.pem`.
- Não publique senhas, tokens ou credenciais em repositórios ou mensagens.
- Mantenha a porta SSH (22) restrita ao seu IP sempre que possível.
- Abra somente as portas necessárias.
- Não execute comandos de remoção sem saber o que eles fazem.
- Não use `docker system prune`, `docker volume prune` ou comandos semelhantes sem orientação: eles podem remover recursos que você ainda precisa.
- Não desligue nem exclua uma EC2 compartilhada sem autorização do professor.
- Confira os custos dos recursos AWS utilizados.

---

# 17. Limpeza do laboratório

Faça a limpeza somente quando o professor autorizar e depois de confirmar que a atividade terminou.

Para parar o container:

```bash
sudo docker stop laboratorio-cetepi
```

Para remover o container:

```bash
sudo docker rm laboratorio-cetepi
```

Para remover a imagem de laboratório, se não precisar mais dela:

```bash
sudo docker rmi laboratorio-cetepi:v1
```

Se também tiver criado a versão 2:

```bash
sudo docker rmi laboratorio-cetepi:v2
```

Explicação:

- `rmi`: significa remover imagem.
- `laboratorio-cetepi:v1`: identifica exatamente qual imagem será removida.

**Atenção:** não confunda `docker rm` (remove container) com `docker rmi` (remove imagem).

Para excluir a instância EC2, faça isso pelo Console AWS somente com autorização do professor. Encerrar a instância pode interromper o site e causar perda de dados armazenados no disco, dependendo da configuração.

---

# 18. Checklist: concluí o primeiro deploy?

Marque cada etapa quando terminar:

- [ ] Conferi os arquivos do site.
- [ ] Entendi para que serve o Dockerfile.
- [ ] Criei o Dockerfile.
- [ ] Entendi as instruções `FROM`, `COPY`, `EXPOSE` e `CMD`.
- [ ] Construí a imagem Docker.
- [ ] Criei e testei um container no computador.
- [ ] Criei ou recebi uma instância EC2 Ubuntu.
- [ ] Configurei o Security Group.
- [ ] Acessei a EC2 por SSH.
- [ ] Instalei o Docker no Ubuntu.
- [ ] Enviei os arquivos para a EC2.
- [ ] Construí a imagem no servidor.
- [ ] Executei o container na EC2.
- [ ] Acessei o site pelo IP público e pela porta 8081.
- [ ] Consultei os logs e verifiquei o container.

---

# 19. Glossário rápido

| Termo | Significado |
|---|---|
| `FROM` | Define a imagem base no Dockerfile |
| `COPY` | Copia arquivos para dentro da imagem |
| `EXPOSE` | Documenta a porta utilizada pelo serviço no container |
| `CMD` | Define o comando padrão de inicialização do container |
| `nginx` | Servidor web utilizado no laboratório |
| `daemon` | Processo que executa como serviço em segundo plano |
| `foreground` | Primeiro plano; processo ligado ao terminal ou processo principal |
| `image` | Imagem Docker |
| `container` | Instância criada a partir de uma imagem |
| `build` | Construir uma imagem |
| `run` | Criar e iniciar um container |
| `-d` | Executar em segundo plano |
| `-p` | Publicar/mapear portas |
| `-t` | Definir nome e tag de imagem no `docker build` |
| `-i` | Informar arquivo de identidade no comando SSH/SCP |
| `-r` | Copiar diretórios recursivamente no SCP |
| `sudo` | Executar um comando com privilégios administrativos |
| `apt` | Gerenciador de pacotes do Ubuntu |
| `systemctl` | Gerenciador de serviços do Linux |
| `SSH` | Acesso remoto seguro |
| `SCP` | Cópia segura de arquivos via SSH |
| `EC2` | Máquina virtual na AWS |
| `IP público` | Endereço usado para alcançar a EC2 pela internet |
| `localhost` | A própria máquina em que o comando está sendo executado |
| `HTTP` | Protocolo utilizado para transferir páginas e outros conteúdos web |
| `TCP` | Protocolo de transporte utilizado nas conexões de rede desta prática |

---

# 20. O que você aprendeu?

Ao concluir a prática, você percorreu o caminho entre um site salvo no computador e um site publicado em uma máquina virtual na nuvem.

Você aprendeu que:

1. O **Dockerfile** é a receita que descreve como construir uma imagem.
2. A **imagem Docker** reúne o Nginx e os arquivos do site.
3. O **container** executa o Nginx e entrega os arquivos ao navegador.
4. A **EC2** é a máquina virtual que hospeda o container.
5. O **Ubuntu** é o sistema operacional da EC2.
6. O **SSH** permite administrar o servidor remotamente.
7. O **Security Group** controla o tráfego que chega à EC2.
8. O parâmetro `-p 8081:80` encaminha a porta 8081 do servidor para a porta 80 do container.

**Parabéns! Você realizou seu primeiro deploy manual com Docker e AWS EC2.**

O próximo laboratório poderá aprofundar o processo, estudando automação de deploy, Amazon ECR e integração contínua.

---

## Identidade visual do CETEP-I Itaparica

A página inicial utiliza a logomarca institucional armazenada em:

```text
website/assets/logo-cetep-i.jpg
```

Os arquivos do site estão organizados em:

```text
website/index.html
website/css/style.css
website/js/script.js
```

Sempre que alterar HTML, CSS, JavaScript ou imagens, será necessário construir uma nova imagem Docker e recriar o container para que a versão atualizada seja publicada.

