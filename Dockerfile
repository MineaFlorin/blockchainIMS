# # Use an official Node.js runtime as a parent image
# FROM node:16

# # Set the working directory inside the container
# WORKDIR /usr/src/app

# # Copy the package.json and package-lock.json to the working directory
# COPY package*.json ./

# # Install the app dependencies
# RUN npm install

# # Copy the rest of the application code into the container
# COPY . .

# # Copy the ca-cert.pem from the certs folder into the container
# COPY ./certs/ca-cert.pem /fabric-network/certs/ca-cert.pem

# # Expose the port the app will run on
# EXPOSE 3000

# # Start the app
# CMD ["npm", "start"]


# Use an official Node.js runtime as a parent image
FROM node:16

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the app dependencies
RUN npm install

# Copy the rest of the application code into the container
COPY . .

# Copy the ca-cert.pem from the certs folder into the container
COPY ./certs/ca-cert.pem /fabric-network/certs/ca-cert.pem

# Expose the port the app will run on
EXPOSE 3000

# Start the app
CMD ["npm", "start"]


