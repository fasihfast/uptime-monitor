FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

# Run Vite dev server, binding to 0.0.0.0 so Nginx can reach it inside Docker
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
