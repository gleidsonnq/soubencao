export function resizeAndConvertToPNG(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const targetSize = 1000; // Tamanho Padrão Ouro (1000x1000px)
          canvas.width = targetSize;
          canvas.height = targetSize;
  
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Não foi possível obter o contexto do Canvas'));
  
          // Preenche o fundo de branco (caso a imagem original tenha transparências nas rebarbas)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, targetSize, targetSize);
  
          // Calcula a proporção para centralizar a imagem sem distorcer (object-contain via código)
          const scale = Math.min(targetSize / img.width, targetSize / img.height);
          const x = (targetSize - img.width * scale) / 2;
          const y = (targetSize - img.height * scale) / 2;
          const width = img.width * scale;
          const height = img.height * scale;
  
          ctx.drawImage(img, x, y, width, height);
  
          // Transforma o canvas em um arquivo binário (Blob) no formato PNG
          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('Erro ao processar imagem'));
            
            // Cria um novo arquivo File pronto para o upload
            const dotIndex = file.name.lastIndexOf('.');
            const nomeOriginal = dotIndex > 0 ? file.name.substring(0, dotIndex) : file.name;
            const newFile = new File([blob], `${nomeOriginal}.png`, { type: 'image/png' });
            resolve(newFile);
          }, 'image/png');
        };
      };
      reader.onerror = (error) => reject(error);
    });
  }