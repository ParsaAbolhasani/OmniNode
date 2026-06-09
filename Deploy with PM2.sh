npm install -g pm2
pm2 start src/index.js --name omninode
pm2 save
pm2 startup