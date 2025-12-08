import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { AppProvider } from '@/context/AppContext';
import Header from '@/components/Header';
import DailySheet from '@/components/DailySheet';
import PrintView from '@/components/PrintView';
import { Helmet } from 'react-helmet-async';

const Dashboard: React.FC = () => {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: 'PCSTE_SECR_Position_Daily_Sheet',
        pageStyle: `
      @page {
        size: A4 landscape;
        margin: 8mm;
      }
      @media print {
        body {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
      }
    `,
    });

    return (
        <AppProvider>
            <Helmet>
                <title>RailTrack - PCSTE/SECR Position Dashboard | Bilaspur Division</title>
                <meta name="description" content="Digital Daily Position Sheet for Indian Railways PCSTE/SECR - Bilaspur Division. Track circuit status, network speed, and equipment inventory." />
            </Helmet>

            <div className="min-h-screen bg-background">
                <Header onPrint={() => handlePrint()} />

                <main className="pb-8">
                    <DailySheet />
                </main>

                {/* Print View - Hidden until printing */}
                <PrintView ref={printRef} />
            </div>
        </AppProvider>
    );
};

export default Dashboard;
