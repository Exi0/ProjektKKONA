/*import mongoose from "mongoose";

const connectDB = async ()=>{

    mongoose.connection.on('connected', ()=>console.log("Database connected"))

    await mongoose.connect(`${process.env.MONGODB_URI}/Projekt-KKona-Tinder?retryWrites=true&w=majority&ssl=true&tlsAllowInvalidCertificates=true`)
}

export default connectDB;*/
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(
      `${process.env.MONGODB_URI}/AgroZakazky?authSource=admin`,
      {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }
    );

    console.log("✅ MongoDB připojeno");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
};

export default connectDB;
