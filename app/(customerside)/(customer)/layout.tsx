 
import { NavBar} from './components/products/Nav'
import Footer from "./components/Footer";
import NotificationSubscriptionPrompt from "./components/PushNotification";
 

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>)

{
  return (
    <div className="bg-green-50">
   
      <NavBar />
   
   <main className="pb-20 lg:pb-0"> {/* Adds 20 units of padding-bottom on mobile, none on large screens */}
          {children}
        </main>
 
      <Footer />
    
     
    </div>
  );
}